import "dotenv/config";

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import express from "express";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const outputsDir = path.join(rootDir, "outputs");
const assetsDir = path.join(outputsDir, "assets");
const dataDir = path.join(rootDir, "data");
const recordsPath = path.join(dataDir, "generation-records.json");
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const app = express();
const port = Number(process.env.PORT || 3001);
const tasks = new Map();

app.use(express.json());
app.use("/outputs", express.static(outputsDir));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    provider: process.env.SEEDANCE_PROVIDER || "seedance2_movie",
    hasApiKey: Boolean(process.env.SEEDANCE_API_KEY)
  });
});

app.get("/api/records", async (_req, res, next) => {
  try {
    res.json({ records: await readRecords() });
  } catch (error) {
    next(error);
  }
});

app.post("/api/assets", upload.single("asset"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "请先选择图片文件。" });
    const saved = await saveUploadedAsset(req.file, req.body.kind || "asset");
    res.json(saved);
  } catch (error) {
    next(error);
  }
});

app.post("/api/frames/generate", async (req, res, next) => {
  try {
    const prompt = String(req.body.prompt || "").trim();
    if (!prompt) return res.status(400).json({ error: "请先填写关键帧提示词。" });
    const saved = await generateFrameAsset({
      prompt,
      frameType: String(req.body.frameType || "first"),
      shotNo: String(req.body.shotNo || ""),
      shotTitle: String(req.body.shotTitle || "")
    });
    res.json(saved);
  } catch (error) {
    next(error);
  }
});

app.post("/api/generate", upload.single("referenceImage"), async (req, res, next) => {
  try {
    const prompt = String(req.body.prompt || "").trim();
    if (!prompt) {
      return res.status(400).json({ error: "请先输入提示词。" });
    }

    assertConfig();

    const options = {
      prompt,
      duration: Number(req.body.duration || 5),
      aspectRatio: String(req.body.aspectRatio || "9:16"),
      resolution: String(req.body.resolution || "1080p"),
      model: String(req.body.model || process.env.SEEDANCE_MODEL || "seedance-2-0-pro"),
      generateAudio: req.body.generateAudio === "true",
      referenceImage: req.file,
      referenceImageUrl: String(req.body.referenceImageUrl || "").trim(),
      firstFrameUrl: String(req.body.firstFrameUrl || "").trim(),
      lastFrameUrl: String(req.body.lastFrameUrl || "").trim(),
      metadata: parseMetadata(req.body.metadata)
    };

    const provider = getProvider();
    const submitResult = await provider.createVideo(options);
    const taskId = submitResult.taskId;

    tasks.set(taskId, {
      taskId,
      provider: process.env.SEEDANCE_PROVIDER || "seedance2_movie",
      createdAt: new Date().toISOString(),
      downloaded: false,
      prompt,
      metadata: options.metadata
    });

    await appendRecord({
      taskId,
      status: "processing",
      provider: process.env.SEEDANCE_PROVIDER || "seedance2_movie",
      prompt,
      metadata: options.metadata,
      createdAt: new Date().toISOString()
    });

    res.json({ taskId, raw: submitResult.raw });
  } catch (error) {
    next(error);
  }
});

app.get("/api/tasks/:taskId", async (req, res, next) => {
  try {
    assertConfig();

    const taskId = req.params.taskId;
    const existingRecord = await findRecord(taskId);
    const task =
      tasks.get(taskId) || {
        taskId,
        downloaded: Boolean(existingRecord?.localUrl),
        localFile: existingRecord?.localFile,
        localUrl: existingRecord?.localUrl,
        metadata: existingRecord?.metadata || {}
      };
    const provider = getProvider();
    const status = await provider.getStatus(taskId);

    if (status.videoUrl && !task.downloaded) {
      const local = await downloadVideo(status.videoUrl, taskId, task.metadata);
      task.downloaded = true;
      task.localFile = local.fileName;
      task.localUrl = local.publicUrl;
      tasks.set(taskId, task);
      await updateRecord(taskId, {
        status: "completed",
        localFile: local.fileName,
        localUrl: local.publicUrl,
        videoUrl: status.videoUrl,
        completedAt: new Date().toISOString()
      });
    }

    if (status.status === "failed") {
      await updateRecord(taskId, {
        status: "failed",
        message: status.message,
        failedAt: new Date().toISOString()
      });
    }

    res.json({
      taskId,
      status: status.status,
      message: status.message,
      videoUrl: status.videoUrl,
      localUrl: task.localUrl,
      localFile: task.localFile,
      raw: status.raw
    });
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.status || 500).json({
    error: error.message || "服务器出错了。",
    detail: error.detail
  });
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(rootDir, "dist")));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(rootDir, "dist", "index.html"));
  });
}

await fs.mkdir(outputsDir, { recursive: true });
await fs.mkdir(assetsDir, { recursive: true });
await fs.mkdir(dataDir, { recursive: true });
app.listen(port, () => {
  console.log(`Seedance studio server is running: http://localhost:${port}`);
});

function assertConfig() {
  if (!process.env.SEEDANCE_API_KEY) {
    const error = new Error("缺少 SEEDANCE_API_KEY。请把 .env.example 复制成 .env，并填入你的真实 API Key。");
    error.status = 400;
    throw error;
  }
}

function parseMetadata(raw) {
  if (!raw) return {};
  try {
    return JSON.parse(String(raw));
  } catch {
    return {};
  }
}

function getProvider() {
  const provider = process.env.SEEDANCE_PROVIDER || "seedance2_movie";
  if (provider === "volcengine_ark") return volcengineArkProvider();
  if (provider === "seedanceapi_org") return seedanceApiOrgProvider();
  return seedance2MovieProvider();
}

function volcengineArkProvider() {
  const baseUrl = cleanBaseUrl(process.env.SEEDANCE_BASE_URL || "https://ark.cn-beijing.volces.com");
  const submitPath = process.env.SEEDANCE_SUBMIT_PATH || "/api/v3/contents/generations/tasks";
  const statusPath = process.env.SEEDANCE_STATUS_PATH || "/api/v3/contents/generations/tasks";

  return {
    async createVideo(options) {
      const content = [{ type: "text", text: options.prompt }];

      const firstFrameUrl = options.referenceImageUrl || options.firstFrameUrl;
      if (firstFrameUrl) {
        content.push({
          type: "image_url",
          image_url: {
            url: firstFrameUrl
          },
          role: "first_frame"
        });
      } else if (options.referenceImage) {
        const error = new Error("火山方舟 Seedance 图生视频需要公网 HTTPS 图片 URL。本地上传图片不能直接作为参考图，请先用 Seedream 生成首帧，或提供可公开访问的图片 URL。");
        error.status = 400;
        throw error;
      }

      if (options.lastFrameUrl) {
        content.push({
          type: "image_url",
          image_url: {
            url: options.lastFrameUrl
          },
          role: "last_frame"
        });
      }

      const raw = await requestJson(`${baseUrl}${submitPath}`, {
        method: "POST",
        headers: bearerHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          model: options.model,
          content,
          ratio: options.aspectRatio,
          duration: options.duration,
          resolution: options.resolution,
          generate_audio: options.generateAudio,
          watermark: false
        })
      });

      const taskId = raw.id || raw.task_id || raw.taskId || raw.data?.id || raw.data?.task_id;
      if (!taskId) throw new Error(`提交成功但没有找到任务 ID：${JSON.stringify(raw)}`);
      return { taskId, raw };
    },

    async getStatus(taskId) {
      const url = `${baseUrl}${statusPath.replace(/\/$/, "")}/${encodeURIComponent(taskId)}`;
      const raw = await requestJson(url, { headers: bearerHeaders() });
      return normalizeStatus(raw);
    }
  };
}

function seedance2MovieProvider() {
  const baseUrl = cleanBaseUrl(process.env.SEEDANCE_BASE_URL || "https://api.seedance2.movie");
  const submitPath = process.env.SEEDANCE_SUBMIT_PATH || "/api/v1/video/task";
  const statusPath = process.env.SEEDANCE_STATUS_PATH || "/api/v1/video/task";
  const uploadPresignPath = process.env.SEEDANCE_UPLOAD_PRESIGN_PATH || "/api/v1/video/upload/presign";

  return {
    async createVideo(options) {
      const content = [{ type: "text", text: options.prompt }];

      if (options.referenceImage) {
        const uploadInfo = await uploadReferenceImage({
          baseUrl,
          uploadPresignPath,
          file: options.referenceImage
        });
        content.push({ type: "image_url", image_url: uploadInfo.filePath || uploadInfo.url });
      }

      const payload = {
        model: options.model,
        content,
        ratio: options.aspectRatio,
        duration: options.duration,
        resolution: options.resolution,
        generate_audio: options.generateAudio
      };

      const raw = await requestJson(`${baseUrl}${submitPath}`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload)
      });

      const taskId = raw.task_id || raw.taskId || raw.id || raw.result?.task_id || raw.data?.task_id || raw.data?.taskId || raw.data?.id;
      if (!taskId) throw new Error(`提交成功但没有找到任务 ID：${JSON.stringify(raw)}`);
      return { taskId, raw };
    },

    async getStatus(taskId) {
      const statusUrl = statusPath.includes("{task_id}")
        ? statusPath.replace("{task_id}", encodeURIComponent(taskId))
        : `${statusPath.replace(/\/$/, "")}/${encodeURIComponent(taskId)}`;
      const url = new URL(`${baseUrl}${statusUrl}`);
      const raw = await requestJson(url, { headers: authHeaders() });
      return normalizeStatus(raw);
    }
  };
}

function seedanceApiOrgProvider() {
  const baseUrl = cleanBaseUrl(process.env.SEEDANCE_BASE_URL || "https://seedanceapi.org");
  const submitPath = process.env.SEEDANCE_SUBMIT_PATH || "/v2/generate";
  const statusPath = process.env.SEEDANCE_STATUS_PATH || "/v2/status";

  return {
    async createVideo(options) {
      if (options.referenceImage) {
        const error = new Error("seedanceapi_org 默认示例没有本地图片上传接口。请改用 seedance2_movie，或按你的平台文档填写公开可访问的图片 URL。");
        error.status = 400;
        throw error;
      }

      const raw = await requestJson(`${baseUrl}${submitPath}`, {
        method: "POST",
        headers: bearerHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          model: options.model,
          prompt: options.prompt,
          duration: options.duration,
          aspect_ratio: options.aspectRatio,
          resolution: options.resolution
        })
      });

      const taskId = raw.task_id || raw.id || raw.data?.task_id || raw.data?.id;
      if (!taskId) throw new Error(`提交成功但没有找到任务 ID：${JSON.stringify(raw)}`);
      return { taskId, raw };
    },

    async getStatus(taskId) {
      const url = new URL(`${baseUrl}${statusPath}`);
      url.searchParams.set("task_id", taskId);
      const raw = await requestJson(url, {
        headers: bearerHeaders()
      });
      return normalizeStatus(raw);
    }
  };
}

async function uploadReferenceImage({ baseUrl, uploadPresignPath, file }) {
  const safeName = file.originalname.replace(/[^\w.-]/g, "_");
  const url = new URL(`${baseUrl}${uploadPresignPath}`);
  url.searchParams.set("filename", `${crypto.randomUUID()}-${safeName}`);
  url.searchParams.set("content_type", file.mimetype || "application/octet-stream");

  const presign = await requestJson(url, { method: "POST", headers: authHeaders() });
  const uploadUrl =
    presign.presigned_url ||
    presign.upload_url ||
    presign.uploadUrl ||
    presign.result?.presigned_url ||
    presign.result?.upload_url ||
    presign.data?.upload_url ||
    presign.data?.uploadUrl;
  const filePath =
    presign.file_path ||
    presign.filePath ||
    presign.result?.file_path ||
    presign.result?.filePath ||
    presign.data?.file_path ||
    presign.data?.filePath;
  const publicUrl = presign.url || presign.public_url || presign.result?.url || presign.result?.public_url || presign.data?.url || presign.data?.public_url;

  if (!uploadUrl) throw new Error(`没有从预签名接口拿到 upload_url：${JSON.stringify(presign)}`);

  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.mimetype || "application/octet-stream" },
    body: file.buffer
  });

  if (!uploadResponse.ok) {
    throw new Error(`参考图上传失败：HTTP ${uploadResponse.status} ${await uploadResponse.text()}`);
  }

  return { filePath, url: publicUrl, raw: presign };
}

async function downloadVideo(videoUrl, taskId, metadata = {}) {
  const response = await fetch(videoUrl);
  if (!response.ok) {
    throw new Error(`视频下载失败：HTTP ${response.status} ${await response.text()}`);
  }

  const contentType = response.headers.get("content-type") || "";
  const ext = contentType.includes("webm") ? "webm" : "mp4";
  const projectDirName = sanitizeFilePart(metadata.projectTitle || "default-project");
  const projectOutputsDir = path.join(outputsDir, projectDirName);
  const fileName = `${taskId}-${Date.now()}.${ext}`;
  const filePath = path.join(projectOutputsDir, fileName);
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.mkdir(projectOutputsDir, { recursive: true });
  await fs.writeFile(filePath, buffer);
  return { fileName: `${projectDirName}/${fileName}`, publicUrl: `/outputs/${projectDirName}/${fileName}` };
}

async function saveUploadedAsset(file, kind) {
  await fs.mkdir(assetsDir, { recursive: true });
  const ext = extensionFromMime(file.mimetype) || path.extname(file.originalname) || ".png";
  const fileName = `${sanitizeFilePart(kind)}-${Date.now()}-${crypto.randomUUID()}${ext}`;
  const filePath = path.join(assetsDir, fileName);
  await fs.writeFile(filePath, file.buffer);
  return {
    fileName,
    localUrl: `/outputs/assets/${fileName}`
  };
}

async function generateFrameAsset({ prompt, frameType, shotNo, shotTitle }) {
  if (process.env.SEEDREAM_API_KEY) {
    return await generateSeedreamFrameAsset({ prompt, frameType, shotNo, shotTitle });
  }

  await fs.mkdir(assetsDir, { recursive: true });
  const label = assetLabel(frameType);
  const fileName = `${frameType}-frame-${Date.now()}-${crypto.randomUUID()}.svg`;
  const filePath = path.join(assetsDir, fileName);
  const safePrompt = escapeXml(prompt.slice(0, 360));
  const safeTitle = escapeXml(`${shotNo ? `${shotNo} ` : ""}${shotTitle || label}`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280" viewBox="0 0 720 1280">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#111827"/>
      <stop offset="55%" stop-color="#1f3b4d"/>
      <stop offset="100%" stop-color="#0f766e"/>
    </linearGradient>
  </defs>
  <rect width="720" height="1280" fill="url(#bg)"/>
  <rect x="48" y="64" width="624" height="1152" rx="24" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.28)" stroke-width="2"/>
  <text x="72" y="128" fill="#d1fae5" font-family="Arial, sans-serif" font-size="30" font-weight="700">${label}</text>
  <text x="72" y="180" fill="#ffffff" font-family="Arial, sans-serif" font-size="38" font-weight="700">${safeTitle}</text>
  <foreignObject x="72" y="240" width="576" height="780">
    <div xmlns="http://www.w3.org/1999/xhtml" style="color:#f8fafc;font-family:Arial,sans-serif;font-size:30px;line-height:1.55;white-space:pre-wrap;">${safePrompt}</div>
  </foreignObject>
  <text x="72" y="1138" fill="#cbd5e1" font-family="Arial, sans-serif" font-size="24">Local keyframe concept image</text>
</svg>`;
  await fs.writeFile(filePath, svg, "utf8");
  return {
    fileName,
    localUrl: `/outputs/assets/${fileName}`,
    provider: "local-placeholder"
  };
}

async function generateSeedreamFrameAsset({ prompt, frameType, shotNo, shotTitle }) {
  const baseUrl = cleanBaseUrl(process.env.SEEDREAM_BASE_URL || "https://ark.cn-beijing.volces.com");
  const model = process.env.SEEDREAM_MODEL || "doubao-seedream-5-0-260128";
  const size = process.env.SEEDREAM_SIZE || "2K";
  const label = assetLabel(frameType);
  const finalPrompt = [
    prompt,
    "",
    `用途：AI 短剧${label}。`,
    "要求：真实人物，电影感灯光，画面干净，不要字幕，不要文字，不要水印。"
  ].join("\n");

  const raw = await requestJson(`${baseUrl}/api/v3/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SEEDREAM_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      prompt: finalPrompt,
      size,
      response_format: "url",
      watermark: false
    })
  });

  const imageUrl = raw.data?.[0]?.url;
  if (!imageUrl) throw new Error(`Seedream 生成成功但没有返回图片 URL：${JSON.stringify(raw)}`);

  const saved = await downloadImageAsset(imageUrl, `${frameType}-frame-${shotNo || "shot"}`);
  return {
    ...saved,
    provider: "seedream",
    sourceUrl: imageUrl,
    model,
    size: raw.data?.[0]?.size || size,
    shotTitle
  };
}

function assetLabel(frameType) {
  if (frameType === "last") return "尾帧";
  if (frameType === "character") return "角色定妆图";
  if (frameType === "scene") return "场景概念图";
  return "首帧";
}

async function downloadImageAsset(imageUrl, namePrefix) {
  await fs.mkdir(assetsDir, { recursive: true });
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Seedream 图片下载失败：HTTP ${response.status} ${await response.text()}`);
  }
  const contentType = response.headers.get("content-type") || "image/jpeg";
  const ext = extensionFromMime(contentType) || ".jpg";
  const fileName = `${sanitizeFilePart(namePrefix)}-${Date.now()}-${crypto.randomUUID()}${ext}`;
  const filePath = path.join(assetsDir, fileName);
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(filePath, buffer);
  return {
    fileName,
    localUrl: `/outputs/assets/${fileName}`
  };
}

function extensionFromMime(mime) {
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  if (mime === "image/svg+xml") return ".svg";
  return "";
}

function sanitizeFilePart(value) {
  return String(value).replace(/[^\w.-]/g, "_").slice(0, 40) || "asset";
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function readRecords() {
  try {
    const text = await fs.readFile(recordsPath, "utf8");
    return JSON.parse(text);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function writeRecords(records) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(recordsPath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
}

async function appendRecord(record) {
  const records = await readRecords();
  records.unshift(record);
  await writeRecords(records.slice(0, 300));
}

async function findRecord(taskId) {
  const records = await readRecords();
  return records.find((record) => record.taskId === taskId) || null;
}

async function updateRecord(taskId, patch) {
  const records = await readRecords();
  const index = records.findIndex((record) => record.taskId === taskId);
  if (index === -1) return;
  records[index] = { ...records[index], ...patch };
  await writeRecords(records);
}

function normalizeStatus(raw) {
  const data = raw.result || raw.data || raw;
  const statusText = String(data.status || data.state || data.task_status || raw.status || "").toLowerCase();
  const videoUrl =
    data.content?.video_url ||
    data.content?.videoUrl ||
    data.content?.[0]?.url ||
    data.video_url ||
    data.videoUrl ||
    data.output?.video_url ||
    data.output?.videoUrl ||
    data.result?.video_url ||
    data.result?.videoUrl ||
    data.response?.[0] ||
    data.videos?.[0]?.url ||
    data.video?.url;

  const done = ["succeeded", "success", "completed", "complete", "done", "finished"].includes(statusText);
  const failed = ["failed", "error", "cancelled", "canceled", "expired"].includes(statusText);

  return {
    status: failed ? "failed" : done || videoUrl ? "completed" : statusText || "processing",
    message: data.message || data.error_message || data.error || data.fail_reason || "",
    videoUrl,
    raw
  };
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }

  if (!response.ok) {
    const error = new Error(`Seedance API 请求失败：HTTP ${response.status}`);
    error.status = response.status;
    error.detail = json;
    throw error;
  }

  if (json.code && String(json.code) !== "200" && String(json.code).toLowerCase() !== "success") {
    const error = new Error(json.message || `Seedance API 返回错误：${json.code}`);
    error.status = 502;
    error.detail = json;
    throw error;
  }

  return json;
}

function authHeaders(extra = {}) {
  return {
    "X-API-Key": process.env.SEEDANCE_API_KEY,
    ...extra
  };
}

function bearerHeaders(extra = {}) {
  return {
    Authorization: `Bearer ${process.env.SEEDANCE_API_KEY}`,
    ...extra
  };
}

function cleanBaseUrl(url) {
  return url.replace(/\/$/, "");
}
