import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const POLL_INTERVAL_MS = 5000;
const STORAGE_KEY = "seedance-libtv-workflow-v1";
const APP_STORAGE_VERSION = 2;
const ESTIMATED_VIDEO_SECONDS = 180;
const ESTIMATED_FRAME_SECONDS = 45;
const BRIDGE_TYPES = ["手部特写", "眼神特写", "呼吸特写", "背影", "玻璃倒影", "衣角/脚步特写", "空镜头", "环境过渡镜头"];

const defaultWorkspace = {
  project: {
    title: "雨夜来电",
    platform: "抖音短剧",
    episode: "第 1 集",
    style: "现实短剧，电影感，真实人物表演，情绪紧张，竖屏构图",
    negativePrompt: "不要字幕，不要文字水印，不要卡通风，不要畸形手指，不要脸部变形",
    defaultRatio: "9:16",
    defaultDuration: "5"
  },
  characters: [
    {
      id: "char-heroine",
      name: "林夏",
      role: "女主",
      description: "24 岁，普通白领，黑色长发，白色针织衫，外表柔弱但很倔强"
    },
    {
      id: "char-male",
      name: "顾沉",
      role: "男主",
      description: "30 岁，冷峻总裁，深色西装，眼神克制，语气低沉"
    }
  ],
  scenes: [
    {
      id: "scene-store",
      name: "雨夜便利店门口",
      description: "城市街角便利店，玻璃门反射霓虹灯，地面有雨水，夜晚冷色调"
    },
    {
      id: "scene-room",
      name: "出租屋",
      description: "狭小但整洁的出租屋，暖色台灯，窗外下雨，适合情绪爆发"
    }
  ],
  shots: [
    {
      id: "shot-001",
      episode: "第 1 集",
      no: "001",
      title: "神秘短信",
      characterId: "char-heroine",
      sceneId: "scene-store",
      shotType: "中近景",
      cameraMove: "缓慢推镜",
      action: "林夏站在便利店门口，低头看到手机里弹出一条陌生短信",
      emotion: "从疑惑变成紧张",
      scene: "雨夜便利店门口，玻璃门反射霓虹，地面湿冷",
      characters: "林夏：白色针织衫，黑色长发，手握手机，神情紧张",
      camera: "中近景，缓慢推镜",
      lighting: "雨夜冷色霓虹，便利店暖光从侧后方打出",
      start_action: "林夏站在便利店门口，低头看手机",
      end_action: "林夏抬头，身体微微僵住，准备回头",
      continuity_note: "作为第一镜，建立雨夜便利店环境和林夏紧张状态",
      bridge_needed: false,
      originalPrompt: "",
      finalPrompt: "",
      videoPath: "",
      dialogue: "",
      duration: "5",
      ratio: "9:16",
      status: "draft",
      taskId: "",
      localUrl: "",
      firstFramePrompt: "",
      firstFrameUrl: "",
      firstFrameSourceUrl: "",
      firstFrameStatus: "draft",
      lastFramePrompt: "",
      lastFrameUrl: "",
      lastFrameSourceUrl: "",
      lastFrameStatus: "draft"
    },
    {
      id: "shot-002",
      episode: "第 1 集",
      no: "002",
      title: "回头确认",
      characterId: "char-heroine",
      sceneId: "scene-store",
      shotType: "特写",
      cameraMove: "手持轻微晃动",
      action: "她猛地回头看向街角，雨水打湿发梢，身后空无一人",
      emotion: "惊慌但强忍镇定",
      scene: "雨夜便利店门口，延续上一镜头的湿冷街角",
      characters: "林夏：白色针织衫，黑色长发被雨水打湿，仍握着手机",
      camera: "特写，手持轻微晃动",
      lighting: "冷色雨夜霓虹，便利店玻璃反光",
      start_action: "接上一镜头，林夏刚抬头，缓慢回头确认身后",
      end_action: "林夏回头看向街角，眼神惊慌但没有发现人",
      continuity_note: "承接上一镜头林夏准备回头的动作，保持手机、服装、雨夜光线一致",
      bridge_needed: false,
      originalPrompt: "",
      finalPrompt: "",
      videoPath: "",
      dialogue: "是谁在跟踪我？",
      duration: "5",
      ratio: "9:16",
      status: "draft",
      taskId: "",
      localUrl: "",
      firstFramePrompt: "",
      firstFrameUrl: "",
      firstFrameSourceUrl: "",
      firstFrameStatus: "draft",
      lastFramePrompt: "",
      lastFrameUrl: "",
      lastFrameSourceUrl: "",
      lastFrameStatus: "draft"
    },
    {
      id: "shot-003",
      episode: "第 1 集",
      no: "003",
      title: "黑车停下",
      characterId: "char-male",
      sceneId: "scene-store",
      shotType: "远景转中景",
      cameraMove: "横移跟拍",
      action: "一辆黑色轿车停在路边，顾沉从车里走出，撑起黑伞看向林夏",
      emotion: "克制、压迫感",
      scene: "雨夜便利店门口，黑色轿车停在街边",
      characters: "顾沉：深色西装，黑伞，冷峻克制；林夏仍在便利店门口",
      camera: "远景转中景，横移跟拍",
      lighting: "雨夜冷色，车灯和便利店暖光形成反差",
      start_action: "接上一镜头，街角出现黑色轿车，林夏看向声音来源",
      end_action: "顾沉撑伞走到林夏面前，停住看向她",
      continuity_note: "从林夏回头看街角，衔接到顾沉从车里出现",
      bridge_needed: true,
      originalPrompt: "",
      finalPrompt: "",
      videoPath: "",
      dialogue: "上车，我送你回去。",
      duration: "5",
      ratio: "9:16",
      status: "draft",
      taskId: "",
      localUrl: "",
      firstFramePrompt: "",
      firstFrameUrl: "",
      firstFrameSourceUrl: "",
      firstFrameStatus: "draft",
      lastFramePrompt: "",
      lastFrameUrl: "",
      lastFrameSourceUrl: "",
      lastFrameStatus: "draft"
    }
  ]
};

function App() {
  const [appState, setAppState] = useState(loadAppState);
  const activeProjectId = appState.activeProjectId;
  const workspace = getActiveWorkspace(appState);
  const [selectedShotId, setSelectedShotId] = useState(() => getActiveWorkspace(loadAppState()).shots[0]?.id || "");
  const [resolution, setResolution] = useState("720p");
  const [generateAudio, setGenerateAudio] = useState(true);
  const [referenceImage, setReferenceImage] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [records, setRecords] = useState([]);
  const [activeTasks, setActiveTasks] = useState({});
  const [clock, setClock] = useState(Date.now());
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [revisionNote, setRevisionNote] = useState("");
  const [frameRevision, setFrameRevision] = useState(null);
  const [frameRevisionNote, setFrameRevisionNote] = useState("");
  const [frameTasks, setFrameTasks] = useState({});
  const [characterImageGenerating, setCharacterImageGenerating] = useState(false);
  const [sceneImageGenerating, setSceneImageGenerating] = useState(false);
  const [characterDraft, setCharacterDraft] = useState({
    editingId: "",
    idea: "24 岁女主，普通白领，外柔内刚，适合雨夜悬疑短剧",
    name: "",
    role: "",
    description: "",
    imageUrl: "",
    imageSourceUrl: "",
    imageStatus: "draft"
  });
  const [sceneDraft, setSceneDraft] = useState({
    editingId: "",
    idea: "雨夜城市街角，便利店门口，霓虹反光，悬疑氛围",
    name: "",
    description: "",
    imageUrl: "",
    imageSourceUrl: "",
    imageStatus: "draft"
  });
  const [selectedReferenceFrame, setSelectedReferenceFrame] = useState("");
  const fileInputRef = useRef(null);
  const firstFrameInputRef = useRef(null);
  const lastFrameInputRef = useRef(null);

  function setWorkspace(updater) {
    setAppState((current) => updateActiveWorkspace(current, updater));
  }

  const selectedShot = workspace.shots.find((shot) => shot.id === selectedShotId) || workspace.shots[0];
  const selectedShotIndex = workspace.shots.findIndex((shot) => shot.id === selectedShot?.id);
  const previousShot = selectedShotIndex > 0 ? workspace.shots[selectedShotIndex - 1] : null;
  const selectedCharacter = workspace.characters.find((item) => item.id === selectedShot?.characterId);
  const selectedScene = workspace.scenes.find((item) => item.id === selectedShot?.sceneId);
  const rawPrompt = useMemo(
    () => composePrompt(workspace.project, selectedShot, selectedCharacter, selectedScene),
    [workspace.project, selectedShot, selectedCharacter, selectedScene]
  );
  const continuityPrompt = useMemo(() => buildContinuityPrompt(previousShot, selectedShot), [previousShot, selectedShot]);
  const prompt = useMemo(() => [continuityPrompt, rawPrompt].filter(Boolean).join("\n\n"), [continuityPrompt, rawPrompt]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  }, [appState]);

  useEffect(() => {
    fetchRecords();
  }, []);

  useEffect(() => {
    setActiveTasks((current) => {
      const next = { ...current };
      let changed = false;
      workspace.shots.forEach((shot) => {
        if (shot.taskId && ["processing", "submitting"].includes(shot.status) && !next[shot.taskId]) {
          next[shot.taskId] = {
            shotId: shot.id,
            startedAt: Date.now(),
            lastCheckedAt: Date.now(),
            checks: 0,
            resumed: true
          };
          changed = true;
        }
      });
      return changed ? next : current;
    });
  }, [workspace.shots]);

  useEffect(() => {
    const taskEntries = Object.entries(activeTasks);
    if (taskEntries.length === 0) return undefined;

    const timer = window.setInterval(() => {
      taskEntries.forEach(([taskId, task]) => pollTask(taskId, task.shotId));
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [activeTasks]);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setSelectedReferenceFrame("");
  }, [selectedShotId]);

  function resetTransientUi() {
    setReferenceImage(null);
    setMessage("");
    setError("");
    setRevisionOpen(false);
    setRevisionNote("");
    setFrameRevision(null);
    setFrameRevisionNote("");
    setActiveTasks({});
    setFrameTasks({});
    setSelectedReferenceFrame("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function switchProject(projectId) {
    const project = appState.projects.find((item) => item.id === projectId);
    if (!project) return;
    setAppState((current) => ({ ...current, activeProjectId: projectId }));
    setSelectedShotId(project.workspace.shots[0]?.id || "");
    resetTransientUi();
  }

  function createProject() {
    const title = window.prompt("新短剧项目名", `新短剧 ${appState.projects.length + 1}`);
    if (!title?.trim()) return;
    const workspace = createBlankWorkspace(title.trim());
    const project = createProjectEntry(workspace);
    setAppState((current) => ({
      ...current,
      activeProjectId: project.id,
      projects: [...current.projects, project]
    }));
    setSelectedShotId("");
    resetTransientUi();
  }

  function duplicateProject() {
    const title = window.prompt("复制为新项目名", `${workspace.project.title} 副本`);
    if (!title?.trim()) return;
    const workspaceCopy = cloneWorkspaceForProject(workspace, title.trim());
    const project = createProjectEntry(workspaceCopy);
    setAppState((current) => ({
      ...current,
      activeProjectId: project.id,
      projects: [...current.projects, project]
    }));
    setSelectedShotId(workspaceCopy.shots[0]?.id || "");
    resetTransientUi();
  }

  function deleteProject() {
    if (appState.projects.length <= 1) {
      setError("至少要保留一个项目。");
      return;
    }
    const confirmed = window.confirm(`确定删除项目「${workspace.project.title}」吗？角色、场景和分镜都会从当前工作台移除。`);
    if (!confirmed) return;
    const nextProjects = appState.projects.filter((project) => project.id !== activeProjectId);
    const nextActiveProject = nextProjects[0];
    setAppState((current) => ({
      ...current,
      activeProjectId: nextActiveProject.id,
      projects: current.projects.filter((project) => project.id !== activeProjectId)
    }));
    setSelectedShotId(nextActiveProject.workspace.shots[0]?.id || "");
    resetTransientUi();
  }

  function updateProject(field, value) {
    setWorkspace((current) => ({
      ...current,
      project: { ...current.project, [field]: value }
    }));
  }

  function updateCollection(collection, id, field, value) {
    setWorkspace((current) => ({
      ...current,
      [collection]: current[collection].map((item) => (item.id === id ? { ...item, [field]: value } : item))
    }));
  }

  function updateShot(id, field, value) {
    updateCollection("shots", id, field, value);
  }

  function updateShotMany(id, patch) {
    setWorkspace((current) => ({
      ...current,
      shots: current.shots.map((shot) => (shot.id === id ? { ...shot, ...patch } : shot))
    }));
  }

  function clearReferenceImage() {
    setReferenceImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setMessage("已删除本次上传的参考图。");
  }

  async function generateCharacterDraft() {
    const idea = characterDraft.idea.trim() || "短剧角色";
    const name = guessCharacterName(idea, workspace.characters.length);
    const draft = {
      ...characterDraft,
      name,
      role: idea.includes("男") ? "男主/重要角色" : idea.includes("女") ? "女主/重要角色" : "重要角色",
      description: [
        idea,
        "外貌要稳定可复用，包含年龄感、发型、服装、气质和表演方向。",
        `适配项目《${workspace.project.title}》：${workspace.project.style}`
      ].join("\n"),
      imageStatus: "generating"
    };
    setCharacterDraft(draft);
    setError("");
    setMessage("正在生成角色定妆图，Seedream 可能需要几十秒。");
    setCharacterImageGenerating(true);

    try {
      const response = await fetch("/api/frames/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: buildCharacterImagePrompt(draft, workspace.project),
          frameType: "character",
          shotNo: "character",
          shotTitle: name
        })
      });
      const json = await response.json();
      if (!response.ok) throw new Error(formatApiError(json, "角色图生成失败。"));
      setCharacterDraft((current) => ({
        ...current,
        imageUrl: json.localUrl,
        imageSourceUrl: json.sourceUrl || "",
        imageStatus: "ready"
      }));
      setMessage(`角色「${name}」草稿和定妆图已生成，请修改确认后保存。`);
    } catch (err) {
      setCharacterDraft((current) => ({ ...current, imageStatus: "failed" }));
      setError(err.message);
    } finally {
      setCharacterImageGenerating(false);
    }
  }

  function saveCharacterDraft() {
    if (!characterDraft.name.trim()) {
      setError("请先生成或填写角色名。");
      return;
    }
    const character = {
      id: characterDraft.editingId || `char-${Date.now()}`,
      name: characterDraft.name.trim(),
      role: characterDraft.role.trim() || "角色",
      description: characterDraft.description.trim(),
      imageUrl: characterDraft.imageUrl || "",
      imageSourceUrl: characterDraft.imageSourceUrl || "",
      imageStatus: characterDraft.imageStatus || "draft"
    };
    setWorkspace((current) => ({
      ...current,
      characters: characterDraft.editingId
        ? current.characters.map((item) => (item.id === characterDraft.editingId ? character : item))
        : [...current.characters, character]
    }));
    setCharacterDraft({ editingId: "", idea: "", name: "", role: "", description: "", imageUrl: "", imageSourceUrl: "", imageStatus: "draft" });
    setMessage(`角色「${character.name}」已${characterDraft.editingId ? "更新" : "保存"}到角色库。`);
  }

  async function generateSceneDraft() {
    const idea = sceneDraft.idea.trim() || "短剧场景";
    const draft = {
      ...sceneDraft,
      name: guessSceneName(idea, workspace.scenes.length),
      description: [
        idea,
        "补充空间结构、时间、天气、光线、色调、道具和镜头氛围。",
        `适配项目《${workspace.project.title}》：${workspace.project.style}`
      ].join("\n"),
      imageStatus: "generating"
    };
    setSceneDraft(draft);
    setError("");
    setMessage("正在生成场景概念图，Seedream 可能需要几十秒。");
    setSceneImageGenerating(true);

    try {
      const response = await fetch("/api/frames/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: buildSceneImagePrompt(draft, workspace.project),
          frameType: "scene",
          shotNo: "scene",
          shotTitle: draft.name
        })
      });
      const json = await response.json();
      if (!response.ok) throw new Error(formatApiError(json, "场景图生成失败。"));
      setSceneDraft((current) => ({
        ...current,
        imageUrl: json.localUrl,
        imageSourceUrl: json.sourceUrl || "",
        imageStatus: "ready"
      }));
      setMessage(`场景「${draft.name}」草稿和概念图已生成，请修改确认后保存。`);
    } catch (err) {
      setSceneDraft((current) => ({ ...current, imageStatus: "failed" }));
      setError(err.message);
    } finally {
      setSceneImageGenerating(false);
    }
  }

  function saveSceneDraft() {
    if (!sceneDraft.name.trim()) {
      setError("请先生成或填写场景名。");
      return;
    }
    const scene = {
      id: sceneDraft.editingId || `scene-${Date.now()}`,
      name: sceneDraft.name.trim(),
      description: sceneDraft.description.trim(),
      imageUrl: sceneDraft.imageUrl || "",
      imageSourceUrl: sceneDraft.imageSourceUrl || "",
      imageStatus: sceneDraft.imageStatus || "draft"
    };
    setWorkspace((current) => ({
      ...current,
      scenes: sceneDraft.editingId ? current.scenes.map((item) => (item.id === sceneDraft.editingId ? scene : item)) : [...current.scenes, scene]
    }));
    setSceneDraft({ editingId: "", idea: "", name: "", description: "", imageUrl: "", imageSourceUrl: "", imageStatus: "draft" });
    setMessage(`场景「${scene.name}」已${sceneDraft.editingId ? "更新" : "保存"}到场景库。`);
  }

  function parseSelectedShotDraft() {
    if (!selectedShot) return;
    const draftText = (selectedShot.draftPrompt || selectedShot.action || "").trim();
    if (!draftText) {
      setError("请先填写分镜草稿。");
      return;
    }
    const patch = parseShotDraft(draftText, selectedShot, workspace);
    updateShotMany(selectedShot.id, patch);
    setMessage(`已把分镜 ${selectedShot.no} 的草稿解析到下方字段，请检查后再生成。`);
  }

  function addShot() {
    const id = `shot-${Date.now()}`;
    const no = String(workspace.shots.length + 1).padStart(3, "0");
    const shot = {
      id,
      episode: workspace.project.episode,
      no,
      title: "新镜头",
      draftPrompt: "",
      characterId: workspace.characters[0]?.id || "",
      sceneId: workspace.scenes[0]?.id || "",
      shotType: "中景",
      cameraMove: "固定机位",
      action: "描述角色正在做什么",
      emotion: "描述表情和情绪变化",
      scene: "",
      characters: "",
      camera: "中景，固定机位",
      lighting: "",
      start_action: "",
      end_action: "",
      continuity_note: "",
      bridge_needed: false,
      originalPrompt: "",
      finalPrompt: "",
      videoPath: "",
      dialogue: "",
      duration: workspace.project.defaultDuration,
      ratio: workspace.project.defaultRatio,
      status: "draft",
      taskId: "",
      localUrl: "",
      firstFramePrompt: "",
      firstFrameUrl: "",
      firstFrameSourceUrl: "",
      firstFrameStatus: "draft",
      lastFramePrompt: "",
      lastFrameUrl: "",
      lastFrameSourceUrl: "",
      lastFrameStatus: "draft"
    };

    setWorkspace((current) => ({ ...current, shots: [...current.shots, shot] }));
    setSelectedShotId(id);
  }

  function deleteShot(id) {
    const shot = workspace.shots.find((item) => item.id === id);
    if (!shot) return;
    const confirmed = window.confirm(`确定删除分镜 ${shot.no}「${shot.title}」吗？`);
    if (!confirmed) return;

    const index = workspace.shots.findIndex((item) => item.id === id);
    const nextShots = renumberShots(workspace.shots.filter((item) => item.id !== id));
    const nextSelected = nextShots[Math.min(index, nextShots.length - 1)] || nextShots[index - 1] || null;

    setWorkspace((current) => ({
      ...current,
      shots: renumberShots(current.shots.filter((item) => item.id !== id))
    }));
    setActiveTasks((current) =>
      Object.fromEntries(Object.entries(current).filter(([, task]) => task.shotId !== id))
    );
    setSelectedShotId(nextSelected?.id || "");
    setMessage(`已删除分镜 ${shot.no}「${shot.title}」。`);
  }

  function insertBridgeShot() {
    if (!selectedShot) return;
    const bridge = buildBridgeShot(previousShot, selectedShot, workspace.project);
    setWorkspace((current) => {
      const index = current.shots.findIndex((shot) => shot.id === selectedShot.id);
      const shots = [...current.shots];
      shots.splice(Math.max(index, 0), 0, bridge);
      return { ...current, shots: renumberShots(shots) };
    });
    setSelectedShotId(bridge.id);
    setMessage(`已插入桥接镜头「${bridge.title}」。`);
  }

  function autoFillContinuity() {
    if (!selectedShot) return;
    const patch = inferContinuityFields(previousShot, selectedShot, selectedCharacter, selectedScene);
    updateShotMany(selectedShot.id, patch);
    setMessage(`已根据上一镜头补全镜头 ${selectedShot.no} 的连续性信息。`);
  }

  function openRevisionDialog() {
    if (!selectedShot) return;
    setRevisionNote(defaultRevisionNote(selectedShot, selectedCharacter, selectedScene));
    setRevisionOpen(true);
  }

  function openFrameRevisionDialog(frameType) {
    if (!selectedShot) return;
    setFrameRevision(frameType);
    setFrameRevisionNote(defaultFrameRevisionNote(frameType, selectedShot));
  }

  async function generateSelectedShot({ revision = "" } = {}) {
    if (!selectedShot || !prompt.trim()) return;

    setError("");
    const isRevision = Boolean(revision.trim());
    setMessage(`${isRevision ? "正在提交返修" : "正在提交"}镜头 ${selectedShot.no}：${selectedShot.title}`);
    markShot(selectedShot.id, { status: "submitting", taskId: "", localUrl: "" });

    try {
      const originalPrompt = rawPrompt;
      const finalPrompt = isRevision ? composeRevisionPrompt(prompt, revision, selectedShot) : prompt;
      const formData = new FormData();
      formData.append("prompt", finalPrompt);
      formData.append("duration", selectedShot.duration);
      formData.append("aspectRatio", selectedShot.ratio);
      formData.append("resolution", resolution);
      formData.append("generateAudio", String(generateAudio));
      const referenceFrame = getReferenceFrame(selectedShot, selectedReferenceFrame, selectedCharacter, selectedScene);
      if (referenceFrame?.sourceUrl) formData.append("firstFrameUrl", referenceFrame.sourceUrl);
      else if (selectedShot.firstFrameSourceUrl) formData.append("firstFrameUrl", selectedShot.firstFrameSourceUrl);
      if (selectedShot.lastFrameSourceUrl) formData.append("lastFrameUrl", selectedShot.lastFrameSourceUrl);
      formData.append(
        "metadata",
        JSON.stringify({
          projectTitle: workspace.project.title,
          projectId: activeProjectId,
          episode: selectedShot.episode,
          shotNo: selectedShot.no,
          shotTitle: selectedShot.title,
          character: selectedCharacter?.name || "",
          scene: selectedScene?.name || "",
          revision: isRevision ? revision : "",
          originalPrompt,
          finalPrompt
        })
      );
      if (referenceImage && !selectedShot.firstFrameSourceUrl && !referenceFrame?.sourceUrl) formData.append("referenceImage", referenceImage);
      if (!referenceImage && !referenceFrame?.sourceUrl && selectedShot.firstFrameUrl && !selectedShot.firstFrameSourceUrl) {
        const firstFrameBlob = await fetchAssetBlob(selectedShot.firstFrameUrl);
        formData.append("referenceImage", firstFrameBlob, `shot-${selectedShot.no}-first-frame.png`);
      }

      const response = await fetch("/api/generate", { method: "POST", body: formData });
      const json = await response.json();
      if (!response.ok) throw new Error(formatApiError(json, "提交任务失败。"));

      markShot(selectedShot.id, { status: "processing", taskId: json.taskId, originalPrompt, finalPrompt });
      setActiveTasks((current) => ({
        ...current,
        [json.taskId]: {
          shotId: selectedShot.id,
          startedAt: Date.now(),
          lastCheckedAt: Date.now(),
          checks: 0
        }
      }));
      setMessage(`镜头 ${selectedShot.no} 已提交，任务 ID：${json.taskId}`);
      setRevisionOpen(false);
      setRevisionNote("");
      await pollTask(json.taskId, selectedShot.id);
      await fetchRecords();
    } catch (err) {
      markShot(selectedShot.id, { status: "failed" });
      setError(err.message);
    }
  }

  async function pollTask(taskId, shotId) {
    try {
      setActiveTasks((current) => {
        if (!current[taskId]) return current;
        return {
          ...current,
          [taskId]: {
            ...current[taskId],
            lastCheckedAt: Date.now(),
            checks: current[taskId].checks + 1
          }
        };
      });
      const response = await fetch(`/api/tasks/${encodeURIComponent(taskId)}`);
      const json = await response.json();
      if (!response.ok) throw new Error(formatApiError(json, "查询任务失败。"));

      if (json.status === "completed") {
        markShot(shotId, { status: "completed", localUrl: json.localUrl || "", videoPath: json.localUrl || json.localFile || "" });
        setActiveTasks((current) => removeKey(current, taskId));
        setMessage("视频已生成并保存到 outputs 文件夹。");
        await fetchRecords();
      } else if (json.status === "failed") {
        markShot(shotId, { status: "failed" });
        setActiveTasks((current) => removeKey(current, taskId));
        setError(json.message || "任务失败，请检查 API 返回信息。");
        await fetchRecords();
      } else {
        markShot(shotId, { status: "processing" });
      }
    } catch (err) {
      setError(err.message);
    }
  }

  function stopPollingShot(shot) {
    if (!shot?.taskId) return;
    setActiveTasks((current) => removeKey(current, shot.taskId));
    markShot(shot.id, { status: "draft" });
    setMessage(`已停止轮询镜头 ${shot.no}。任务 ID 已保留，可稍后手动刷新。`);
  }

  async function fetchRecords() {
    try {
      const response = await fetch("/api/records");
      const json = await response.json();
      if (response.ok) {
        const nextRecords = json.records || [];
        setRecords(nextRecords);
        syncShotsFromRecords(nextRecords);
      }
    } catch {
      setRecords([]);
    }
  }

  function syncShotsFromRecords(nextRecords) {
    const recordByTaskId = new Map(filterRecordsForProject(nextRecords, activeProjectId, workspace.project.title).filter((record) => record.taskId).map((record) => [record.taskId, record]));
    setWorkspace((current) => {
      let changed = false;
      const shots = current.shots.map((shot) => {
        if (!shot.taskId) return shot;
        const record = recordByTaskId.get(shot.taskId);
        if (!record || !["completed", "failed"].includes(record.status)) return shot;
        if (record.status === "completed") {
          const localUrl = record.localUrl || (record.localFile ? `/outputs/${record.localFile}` : shot.localUrl || "");
          if (shot.status === "completed" && shot.localUrl === localUrl) return shot;
          changed = true;
          return {
            ...shot,
            status: "completed",
            localUrl,
            videoPath: localUrl || record.localFile || shot.videoPath || ""
          };
        }
        if (shot.status === "failed") return shot;
        changed = true;
        return { ...shot, status: "failed" };
      });
      return changed ? { ...current, shots } : current;
    });
  }

  function markShot(id, patch) {
    setWorkspace((current) => ({
      ...current,
      shots: current.shots.map((shot) => (shot.id === id ? { ...shot, ...patch } : shot))
    }));
  }

  async function generateFrame(frameType, revision = "") {
    if (!selectedShot) return;
    const promptField = frameType === "first" ? "firstFramePrompt" : "lastFramePrompt";
    const urlField = frameType === "first" ? "firstFrameUrl" : "lastFrameUrl";
    const statusField = frameType === "first" ? "firstFrameStatus" : "lastFrameStatus";
    const baseFramePrompt = selectedShot[promptField] || defaultFramePrompt(frameType, selectedShot, selectedCharacter, selectedScene, workspace.project);
    const framePrompt = revision.trim() ? composeFrameRevisionPrompt(baseFramePrompt, revision, frameType, selectedShot) : baseFramePrompt;

    setError("");
    setMessage(`正在生成${frameType === "first" ? "首帧" : "尾帧"}，Seedream 可能需要几十秒，请稍等。`);
    setFrameTasks((current) => ({
      ...current,
      [`${selectedShot.id}:${frameType}`]: {
        startedAt: Date.now(),
        frameType,
        shotId: selectedShot.id,
        revision: Boolean(revision.trim())
      }
    }));
    markShot(selectedShot.id, { [promptField]: framePrompt, [statusField]: "generating" });

    try {
      const response = await fetch("/api/frames/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: framePrompt,
          frameType,
          shotNo: selectedShot.no,
          shotTitle: selectedShot.title
        })
      });
      const json = await response.json();
      if (!response.ok) throw new Error(formatApiError(json, "关键帧生成失败。"));
      markShot(selectedShot.id, {
        [urlField]: json.localUrl,
        [frameType === "first" ? "firstFrameSourceUrl" : "lastFrameSourceUrl"]: json.sourceUrl || "",
        [statusField]: "ready"
      });
      setFrameTasks((current) => removeKey(current, `${selectedShot.id}:${frameType}`));
      setFrameRevision(null);
      setFrameRevisionNote("");
      setMessage(`${frameType === "first" ? "首帧" : "尾帧"}已生成并保存到 outputs/assets。`);
    } catch (err) {
      setFrameTasks((current) => removeKey(current, `${selectedShot.id}:${frameType}`));
      markShot(selectedShot.id, { [statusField]: "failed" });
      setError(err.message);
    }
  }

  async function uploadFrame(frameType, file) {
    if (!selectedShot || !file) return;
    const urlField = frameType === "first" ? "firstFrameUrl" : "lastFrameUrl";
    const statusField = frameType === "first" ? "firstFrameStatus" : "lastFrameStatus";
    const formData = new FormData();
    formData.append("asset", file);
    formData.append("kind", `${selectedShot.no}-${frameType}-frame`);

    try {
      const response = await fetch("/api/assets", { method: "POST", body: formData });
      const json = await response.json();
      if (!response.ok) throw new Error(formatApiError(json, "关键帧上传失败。"));
      markShot(selectedShot.id, {
        [urlField]: json.localUrl,
        [frameType === "first" ? "firstFrameSourceUrl" : "lastFrameSourceUrl"]: "",
        [statusField]: "ready"
      });
      setMessage(`${frameType === "first" ? "首帧" : "尾帧"}已上传。`);
    } catch (err) {
      setError(err.message);
    }
  }

  const completedCount = workspace.shots.filter((shot) => shot.status === "completed").length;
  const selectedTask = selectedShot?.taskId ? activeTasks[selectedShot.taskId] : null;
  const selectedTaskView =
    selectedTask ||
    (selectedShot?.taskId && ["processing", "submitting"].includes(selectedShot.status)
      ? { shotId: selectedShot.id, startedAt: clock, checks: 0, resumed: true }
      : null);
  const selectedTaskProgress = selectedTaskView ? taskProgress(selectedTaskView, clock) : 0;
  const frameTaskKey = selectedShot && frameRevision ? `${selectedShot.id}:${frameRevision}` : "";
  const activeFrameTask = frameTaskKey ? frameTasks[frameTaskKey] : null;
  const frameRevisionProgress = activeFrameTask ? frameProgress(activeFrameTask, clock) : 0;
  const referenceFrames = selectedShot ? getAvailableReferenceFrames(selectedShot, selectedCharacter, selectedScene) : [];
  const projectRecords = filterRecordsForProject(records, activeProjectId, workspace.project.title);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Local LibTV Lite</p>
          <h1>AI 短剧工作流</h1>
        </div>
        <div className="project-switcher">
          <label className="field compact">
            <span>当前项目</span>
            <select value={activeProjectId} onChange={(event) => switchProject(event.target.value)}>
              {appState.projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.workspace.project.title}
                </option>
              ))}
            </select>
          </label>
          <button className="secondary" type="button" onClick={createProject}>
            新建项目
          </button>
          <button className="secondary" type="button" onClick={duplicateProject}>
            复制项目
          </button>
          <button className="text-danger" type="button" onClick={deleteProject}>
            删除项目
          </button>
          <div className="top-stats">
            <span>{appState.projects.length} 个项目</span>
            <span>{workspace.shots.length} 个镜头</span>
            <span>{completedCount} 个完成</span>
          </div>
        </div>
      </header>

      <section className="studio-grid">
        <aside className="panel sidebar">
          <SectionTitle title="项目" />
          <label className="field compact">
            <span>项目名</span>
            <input value={workspace.project.title} onChange={(event) => updateProject("title", event.target.value)} />
          </label>
          <div className="two-cols">
            <label className="field compact">
              <span>平台</span>
              <select value={workspace.project.platform} onChange={(event) => updateProject("platform", event.target.value)}>
                <option>抖音短剧</option>
                <option>快手短剧</option>
                <option>小红书</option>
                <option>TikTok</option>
                <option>YouTube Shorts</option>
              </select>
            </label>
            <label className="field compact">
              <span>集数</span>
              <input value={workspace.project.episode} onChange={(event) => updateProject("episode", event.target.value)} />
            </label>
          </div>
          <label className="field compact">
            <span>全局风格</span>
            <textarea value={workspace.project.style} rows={3} onChange={(event) => updateProject("style", event.target.value)} />
          </label>
          <label className="field compact">
            <span>负向提示词</span>
            <textarea
              value={workspace.project.negativePrompt}
              rows={3}
              onChange={(event) => updateProject("negativePrompt", event.target.value)}
            />
          </label>

          <div className="section-head">
            <SectionTitle title="角色库" />
          </div>
          <div className="asset-composer">
            <label className="field compact">
              <span>角色描述</span>
              <textarea value={characterDraft.idea} rows={3} onChange={(event) => setCharacterDraft({ ...characterDraft, idea: event.target.value })} />
            </label>
            <div className="two-cols">
              <button className="secondary" type="button" disabled={characterImageGenerating} onClick={generateCharacterDraft}>
                {characterImageGenerating ? "生成中..." : "生成角色草稿"}
              </button>
              <button className="small-action" type="button" onClick={saveCharacterDraft}>
                {characterDraft.editingId ? "确认更新角色" : "确认保存角色"}
              </button>
            </div>
            <div className="asset-image-preview">
              {characterDraft.imageUrl ? <img src={characterDraft.imageUrl} alt="角色定妆图" /> : <span>角色定妆图会在这里预览</span>}
            </div>
            <label className="field compact">
              <span>角色名</span>
              <input value={characterDraft.name} onChange={(event) => setCharacterDraft({ ...characterDraft, name: event.target.value })} />
            </label>
            <label className="field compact">
              <span>身份</span>
              <input value={characterDraft.role} onChange={(event) => setCharacterDraft({ ...characterDraft, role: event.target.value })} />
            </label>
            <label className="field compact">
              <span>确认前可修改</span>
              <textarea value={characterDraft.description} rows={4} onChange={(event) => setCharacterDraft({ ...characterDraft, description: event.target.value })} />
            </label>
          </div>
          <div className="stack">
            {workspace.characters.map((character) => (
              <div className="asset-card" key={character.id}>
                {character.imageUrl && <img className="asset-thumb" src={character.imageUrl} alt={`${character.name}定妆图`} />}
                <strong>{character.name}</strong>
                <span>{character.role}</span>
                <p>{character.description}</p>
                <button className="secondary" type="button" onClick={() => setCharacterDraft({ editingId: character.id, idea: "", ...character })}>
                  修改
                </button>
              </div>
            ))}
          </div>

          <div className="section-head">
            <SectionTitle title="场景库" />
          </div>
          <div className="asset-composer">
            <label className="field compact">
              <span>场景描述</span>
              <textarea value={sceneDraft.idea} rows={3} onChange={(event) => setSceneDraft({ ...sceneDraft, idea: event.target.value })} />
            </label>
            <div className="two-cols">
              <button className="secondary" type="button" disabled={sceneImageGenerating} onClick={generateSceneDraft}>
                {sceneImageGenerating ? "生成中..." : "生成场景草稿"}
              </button>
              <button className="small-action" type="button" onClick={saveSceneDraft}>
                {sceneDraft.editingId ? "确认更新场景" : "确认保存场景"}
              </button>
            </div>
            <div className="asset-image-preview">
              {sceneDraft.imageUrl ? <img src={sceneDraft.imageUrl} alt="场景概念图" /> : <span>场景概念图会在这里预览</span>}
            </div>
            <label className="field compact">
              <span>场景名</span>
              <input value={sceneDraft.name} onChange={(event) => setSceneDraft({ ...sceneDraft, name: event.target.value })} />
            </label>
            <label className="field compact">
              <span>确认前可修改</span>
              <textarea value={sceneDraft.description} rows={4} onChange={(event) => setSceneDraft({ ...sceneDraft, description: event.target.value })} />
            </label>
          </div>
          <div className="stack">
            {workspace.scenes.map((scene) => (
              <div className="asset-card" key={scene.id}>
                {scene.imageUrl && <img className="asset-thumb scene-thumb" src={scene.imageUrl} alt={`${scene.name}概念图`} />}
                <strong>{scene.name}</strong>
                <p>{scene.description}</p>
                <button className="secondary" type="button" onClick={() => setSceneDraft({ editingId: scene.id, idea: "", ...scene })}>
                  修改
                </button>
              </div>
            ))}
          </div>
        </aside>

        <section className="panel storyboard">
          <div className="section-head">
            <SectionTitle title="分镜表" />
            <button className="secondary" type="button" onClick={addShot}>
              新增镜头
            </button>
          </div>

          <div className="shot-table">
            {workspace.shots.map((shot) => (
              <div
                className={`shot-row ${shot.id === selectedShot?.id ? "selected" : ""}`}
                key={shot.id}
              >
                <button className="shot-select" type="button" onClick={() => setSelectedShotId(shot.id)}>
                  <span className="shot-no">{shot.no}</span>
                  <span>
                    <strong>{shot.title}</strong>
                    <small>{shot.start_action || shot.action}</small>
                    <small>{shot.end_action ? `结束：${shot.end_action}` : ""}</small>
                  </span>
                  <span className="shot-flags">
                    {shot.bridge_needed && <em>需桥接</em>}
                    <StatusBadge status={shot.status} />
                  </span>
                </button>
                <button className="delete-shot" type="button" onClick={() => deleteShot(shot.id)} aria-label={`删除分镜 ${shot.no}`}>
                  删除
                </button>
              </div>
            ))}
          </div>

          {selectedShot && (
            <div className="shot-editor">
              <div className="draft-parser">
                <label className="field compact">
                  <span>分镜草稿 / 自然语言提示词</span>
                  <textarea
                    value={selectedShot.draftPrompt || ""}
                    rows={5}
                    placeholder="例如：镜头标题：回头确认。特写，手持轻微晃动。林夏猛地回头看向街角，雨水打湿发梢，身后空无一人。情绪惊慌但强忍镇定。台词：是谁在跟踪我？"
                    onChange={(event) => updateShot(selectedShot.id, "draftPrompt", event.target.value)}
                  />
                </label>
                <div className="inline-actions">
                  <button className="small-action" type="button" onClick={parseSelectedShotDraft}>
                    解析到字段
                  </button>
                  <span className="muted">解析后仍可手动微调下面的镜别、运镜、动作、情绪和连续性。</span>
                </div>
              </div>

              <div className="two-cols">
                <label className="field compact">
                  <span>镜头标题</span>
                  <input value={selectedShot.title} onChange={(event) => updateShot(selectedShot.id, "title", event.target.value)} />
                </label>
                <label className="field compact">
                  <span>镜头编号</span>
                  <input value={selectedShot.no} onChange={(event) => updateShot(selectedShot.id, "no", event.target.value)} />
                </label>
              </div>
              <div className="three-cols">
                <label className="field compact">
                  <span>角色</span>
                  <select value={selectedShot.characterId} onChange={(event) => updateShot(selectedShot.id, "characterId", event.target.value)}>
                    {workspace.characters.map((character) => (
                      <option key={character.id} value={character.id}>
                        {character.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field compact">
                  <span>场景</span>
                  <select value={selectedShot.sceneId} onChange={(event) => updateShot(selectedShot.id, "sceneId", event.target.value)}>
                    {workspace.scenes.map((scene) => (
                      <option key={scene.id} value={scene.id}>
                        {scene.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field compact">
                  <span>时长</span>
                  <select value={selectedShot.duration} onChange={(event) => updateShot(selectedShot.id, "duration", event.target.value)}>
                    <option value="5">5 秒</option>
                    <option value="10">10 秒</option>
                  </select>
                </label>
              </div>
              <div className="three-cols">
                <label className="field compact">
                  <span>镜别</span>
                  <input value={selectedShot.shotType} onChange={(event) => updateShot(selectedShot.id, "shotType", event.target.value)} />
                </label>
                <label className="field compact">
                  <span>运镜</span>
                  <input value={selectedShot.cameraMove} onChange={(event) => updateShot(selectedShot.id, "cameraMove", event.target.value)} />
                </label>
                <label className="field compact">
                  <span>比例</span>
                  <select value={selectedShot.ratio} onChange={(event) => updateShot(selectedShot.id, "ratio", event.target.value)}>
                    <option value="9:16">9:16</option>
                    <option value="16:9">16:9</option>
                    <option value="1:1">1:1</option>
                  </select>
                </label>
              </div>
              <label className="field compact">
                <span>动作</span>
                <textarea value={selectedShot.action} rows={3} onChange={(event) => updateShot(selectedShot.id, "action", event.target.value)} />
              </label>
              <div className="two-cols">
                <label className="field compact">
                  <span>情绪</span>
                  <textarea value={selectedShot.emotion} rows={3} onChange={(event) => updateShot(selectedShot.id, "emotion", event.target.value)} />
                </label>
                <label className="field compact">
                  <span>台词/旁白</span>
                  <textarea value={selectedShot.dialogue} rows={3} onChange={(event) => updateShot(selectedShot.id, "dialogue", event.target.value)} />
                </label>
              </div>

              <div className="continuity-section">
                <div className="section-head">
                  <SectionTitle title="连续性信息" />
                  <div className="inline-actions">
                    <button className="secondary" type="button" onClick={autoFillContinuity}>
                      继承上一镜头
                    </button>
                    <button className="small-action" type="button" onClick={insertBridgeShot}>
                      插入桥接镜头
                    </button>
                  </div>
                </div>
                {previousShot && (
                  <div className="continuity-prev">
                    <strong>上一镜头 {previousShot.no}</strong>
                    <span>结尾动作：{previousShot.end_action || previousShot.action || "未填写"}</span>
                    <span>情绪：{previousShot.emotion || "未填写"}</span>
                    <span>光线：{previousShot.lighting || "未填写"}</span>
                  </div>
                )}
                <div className="two-cols">
                  <label className="field compact">
                    <span>场景状态</span>
                    <textarea value={selectedShot.scene || ""} rows={3} onChange={(event) => updateShot(selectedShot.id, "scene", event.target.value)} />
                  </label>
                  <label className="field compact">
                    <span>人物及服装状态</span>
                    <textarea value={selectedShot.characters || ""} rows={3} onChange={(event) => updateShot(selectedShot.id, "characters", event.target.value)} />
                  </label>
                </div>
                <div className="two-cols">
                  <label className="field compact">
                    <span>镜头距离和运镜</span>
                    <textarea value={selectedShot.camera || ""} rows={3} onChange={(event) => updateShot(selectedShot.id, "camera", event.target.value)} />
                  </label>
                  <label className="field compact">
                    <span>光线氛围</span>
                    <textarea value={selectedShot.lighting || ""} rows={3} onChange={(event) => updateShot(selectedShot.id, "lighting", event.target.value)} />
                  </label>
                </div>
                <div className="two-cols">
                  <label className="field compact">
                    <span>开头动作</span>
                    <textarea value={selectedShot.start_action || ""} rows={3} onChange={(event) => updateShot(selectedShot.id, "start_action", event.target.value)} />
                  </label>
                  <label className="field compact">
                    <span>结尾动作</span>
                    <textarea value={selectedShot.end_action || ""} rows={3} onChange={(event) => updateShot(selectedShot.id, "end_action", event.target.value)} />
                  </label>
                </div>
                <label className="field compact">
                  <span>与上一镜头的衔接说明</span>
                  <textarea
                    value={selectedShot.continuity_note || ""}
                    rows={3}
                    onChange={(event) => updateShot(selectedShot.id, "continuity_note", event.target.value)}
                  />
                </label>
                <label className="toggle continuity-toggle">
                  <input
                    type="checkbox"
                    checked={Boolean(selectedShot.bridge_needed)}
                    onChange={(event) => updateShot(selectedShot.id, "bridge_needed", event.target.checked)}
                  />
                  <span>需要桥接镜头掩盖跳切</span>
                </label>
              </div>

              <div className="keyframe-section">
                <div className="section-head">
                  <SectionTitle title="首尾帧" />
                  <span className="muted">首帧会自动作为视频参考图</span>
                </div>
                <div className="keyframe-grid">
                  <FrameCard
                    title="首帧"
                    imageUrl={selectedShot.firstFrameUrl}
                    status={selectedShot.firstFrameStatus}
                    prompt={selectedShot.firstFramePrompt || defaultFramePrompt("first", selectedShot, selectedCharacter, selectedScene, workspace.project)}
                    onPromptChange={(value) => updateShot(selectedShot.id, "firstFramePrompt", value)}
                    onGenerate={() => generateFrame("first")}
                    onRevise={() => openFrameRevisionDialog("first")}
                    onUploadClick={() => firstFrameInputRef.current?.click()}
                  />
                  <FrameCard
                    title="尾帧"
                    imageUrl={selectedShot.lastFrameUrl}
                    status={selectedShot.lastFrameStatus}
                    prompt={selectedShot.lastFramePrompt || defaultFramePrompt("last", selectedShot, selectedCharacter, selectedScene, workspace.project)}
                    onPromptChange={(value) => updateShot(selectedShot.id, "lastFramePrompt", value)}
                    onGenerate={() => generateFrame("last")}
                    onRevise={() => openFrameRevisionDialog("last")}
                    onUploadClick={() => lastFrameInputRef.current?.click()}
                  />
                </div>
                <input
                  ref={firstFrameInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  hidden
                  onChange={(event) => uploadFrame("first", event.target.files?.[0])}
                />
                <input
                  ref={lastFrameInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  hidden
                  onChange={(event) => uploadFrame("last", event.target.files?.[0])}
                />
              </div>
            </div>
          )}
        </section>

        <aside className="panel generate-panel">
          <SectionTitle title="生成面板" />

          <div className="two-cols">
            <label className="field compact">
              <span>清晰度</span>
              <select value={resolution} onChange={(event) => setResolution(event.target.value)}>
                <option value="480p">480p</option>
                <option value="720p">720p</option>
              </select>
            </label>
            <label className="toggle compact-toggle">
              <input type="checkbox" checked={generateAudio} onChange={(event) => setGenerateAudio(event.target.checked)} />
              <span>生成音频</span>
            </label>
          </div>

          {referenceFrames.length > 0 && (
            <label className="field compact">
              <span>从角色图/首尾帧选择参考图</span>
              <select value={selectedReferenceFrame} onChange={(event) => setSelectedReferenceFrame(event.target.value)}>
                <option value="">自动选择最佳参考图</option>
                {referenceFrames.map((frame) => (
                  <option key={frame.value} value={frame.value}>
                    {frame.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <details className="advanced-options">
            <summary>高级选项</summary>
            <div className="upload-row">
              <button type="button" className="secondary" onClick={() => fileInputRef.current?.click()}>
                上传参考图
              </button>
              <span>{referenceImage ? referenceImage.name : "仅在需要临时兜底时使用"}</span>
              {referenceImage && (
                <button type="button" className="text-danger" onClick={clearReferenceImage}>
                  删除参考图
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => setReferenceImage(event.target.files?.[0] || null)}
                hidden
              />
            </div>
            <p className="hint">优先使用角色图、场景图或 Seedream 生成的首帧。本地上传图如果没有公网 URL，可能会被 Ark 拒绝。</p>
          </details>

          <div className={`preview-box ${selectedShot?.localUrl ? "has-video" : `empty-preview ${ratioClassName(selectedShot?.ratio)}`}`}>
            {selectedShot?.localUrl ? (
              <video src={selectedShot.localUrl} controls autoPlay loop />
            ) : (
              <div className="empty">
                <strong>{selectedShot?.title || "选择镜头"}</strong>
                <span>生成完成后会自动保存到 outputs 文件夹</span>
              </div>
            )}
          </div>

          <label className="field compact">
            <span>加入连续性后的最终提示词</span>
            <textarea className="prompt-preview" value={prompt} rows={6} readOnly />
          </label>

          <div className="generate-actions">
            <button className="primary" type="button" disabled={!selectedShot || selectedShot.status === "submitting"} onClick={() => generateSelectedShot()}>
              {selectedShot?.status === "submitting" ? "正在提交..." : "生成当前镜头"}
            </button>

            <button
              className="secondary wide"
              type="button"
              disabled={!selectedShot || selectedShot.status === "submitting" || selectedShot.status === "processing"}
              onClick={openRevisionDialog}
            >
              基于当前视频返修
            </button>
          </div>

          {selectedShot?.taskId && (
            <div className="task-info">
              <span>任务 ID</span>
              <code>{selectedShot.taskId}</code>
            </div>
          )}

          {["processing", "submitting"].includes(selectedShot?.status) && selectedShot?.taskId && selectedTaskView && (
            <div className="progress-card">
              <div className="section-head">
                <strong>生成进度</strong>
                <span>{selectedTaskProgress}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${selectedTaskProgress}%` }} />
              </div>
              <div className="progress-meta">
                <span>已等待 {formatDuration(Math.floor((clock - selectedTaskView.startedAt) / 1000))}</span>
                <span>已刷新 {selectedTaskView.checks} 次</span>
                {selectedTaskView.resumed && <span>已恢复轮询</span>}
              </div>
              <button className="secondary wide" type="button" onClick={() => pollTask(selectedShot.taskId, selectedShot.id)}>
                手动刷新状态
              </button>
              <button className="secondary wide" type="button" onClick={() => stopPollingShot(selectedShot)}>
                停止等待，改回草稿
              </button>
            </div>
          )}
          {message && <p className="note">{message}</p>}
          {error && <p className="error">{error}</p>}

          <SectionTitle title="最近生成" />
          <div className="records">
            {projectRecords.slice(0, 5).map((record) => (
              <div className="record" key={record.taskId}>
                <strong>{record.metadata?.shotNo || "--"} {record.metadata?.shotTitle || record.taskId}</strong>
                <span>{statusText(record.status)}</span>
                {record.localUrl && (
                  <a href={record.localUrl} target="_blank" rel="noreferrer">
                    打开
                  </a>
                )}
              </div>
            ))}
            {projectRecords.length === 0 && <p className="muted">当前项目还没有生成记录</p>}
          </div>
        </aside>
      </section>

      {revisionOpen && selectedShot && (
        <div className="modal-backdrop" role="presentation">
          <section className="revision-modal" role="dialog" aria-modal="true" aria-labelledby="revision-title">
            <div className="section-head">
              <div>
                <p className="eyebrow">Revise Shot</p>
                <h2 id="revision-title">基于已生成视频修改</h2>
              </div>
              <StatusBadge status={selectedShot.status} />
            </div>

            {selectedShot.localUrl ? (
              <video className="revision-video" src={selectedShot.localUrl} controls />
            ) : (
              <div className="revision-empty">当前分镜还没有本地视频，也可以先写返修要求重新生成。</div>
            )}

            <label className="field compact">
              <span>这版哪里不满意，要怎么改</span>
              <textarea value={revisionNote} rows={8} onChange={(event) => setRevisionNote(event.target.value)} />
            </label>

            <label className="field compact">
              <span>原始合成提示词</span>
              <textarea value={prompt} rows={6} readOnly />
            </label>

            <div className="modal-actions">
              <button className="secondary" type="button" onClick={() => setRevisionOpen(false)}>
                取消
              </button>
              <button className="primary" type="button" disabled={!revisionNote.trim()} onClick={() => generateSelectedShot({ revision: revisionNote })}>
                按修改意见重新生成
              </button>
            </div>
          </section>
        </div>
      )}

      {frameRevision && selectedShot && (
        <div className="modal-backdrop" role="presentation">
          <section className="revision-modal" role="dialog" aria-modal="true" aria-labelledby="frame-revision-title">
            <div className="section-head">
              <div>
                <p className="eyebrow">Revise Keyframe</p>
                <h2 id="frame-revision-title">返修{frameRevision === "first" ? "首帧" : "尾帧"}</h2>
              </div>
              <span className={`frame-status ${selectedShot[frameRevision === "first" ? "firstFrameStatus" : "lastFrameStatus"] || "draft"}`}>
                {frameStatusText(selectedShot[frameRevision === "first" ? "firstFrameStatus" : "lastFrameStatus"])}
              </span>
            </div>

            {selectedShot[frameRevision === "first" ? "firstFrameUrl" : "lastFrameUrl"] ? (
              <img
                className="revision-image"
                src={selectedShot[frameRevision === "first" ? "firstFrameUrl" : "lastFrameUrl"]}
                alt={`${frameRevision === "first" ? "首帧" : "尾帧"}预览`}
              />
            ) : (
              <div className="revision-empty">当前关键帧还没有图片，也可以先写修改要求生成新版。</div>
            )}

            <label className="field compact">
              <span>这张关键帧哪里不满意，要怎么改</span>
              <textarea value={frameRevisionNote} rows={7} onChange={(event) => setFrameRevisionNote(event.target.value)} />
            </label>

            <label className="field compact">
              <span>原关键帧提示词</span>
              <textarea
                value={
                  selectedShot[frameRevision === "first" ? "firstFramePrompt" : "lastFramePrompt"] ||
                  defaultFramePrompt(frameRevision, selectedShot, selectedCharacter, selectedScene, workspace.project)
                }
                rows={6}
                readOnly
              />
            </label>

            {selectedShot[frameRevision === "first" ? "firstFrameStatus" : "lastFrameStatus"] === "generating" && (
              <div className="progress-card">
                <div className="section-head">
                  <strong>关键帧生成进度</strong>
                  <span>{frameRevisionProgress}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${frameRevisionProgress}%` }} />
                </div>
                <div className="progress-meta">
                  <span>正在调用 Seedream</span>
                  {activeFrameTask && <span>已等待 {formatDuration(Math.floor((clock - activeFrameTask.startedAt) / 1000))}</span>}
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button className="secondary" type="button" onClick={() => setFrameRevision(null)}>
                取消
              </button>
              <button
                className="primary"
                type="button"
                disabled={!frameRevisionNote.trim() || selectedShot[frameRevision === "first" ? "firstFrameStatus" : "lastFrameStatus"] === "generating"}
                onClick={() => generateFrame(frameRevision, frameRevisionNote)}
              >
                {selectedShot[frameRevision === "first" ? "firstFrameStatus" : "lastFrameStatus"] === "generating" ? "正在生成..." : "按修改意见生成新版"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function SectionTitle({ title }) {
  return <h2>{title}</h2>;
}

function StatusBadge({ status }) {
  return <span className={`badge ${status || "draft"}`}>{statusText(status)}</span>;
}

function FrameCard({ title, imageUrl, status, prompt, onPromptChange, onGenerate, onRevise, onUploadClick }) {
  return (
    <div className="frame-card">
      <div className="frame-preview">
        {imageUrl ? <img src={imageUrl} alt={`${title}预览`} /> : <span>{title}预览</span>}
      </div>
      <div className="section-head">
        <strong>{title}</strong>
        <span className={`frame-status ${status || "draft"}`}>{frameStatusText(status)}</span>
      </div>
      <label className="field compact">
        <span>{title}提示词</span>
        <textarea value={prompt} rows={5} onChange={(event) => onPromptChange(event.target.value)} />
      </label>
      <div className="frame-actions">
        <button className="secondary" type="button" onClick={onUploadClick}>
          上传{title}
        </button>
        <button className="small-action" type="button" onClick={onGenerate}>
          生成{title}
        </button>
        <button className="secondary" type="button" onClick={onRevise}>
          返修{title}
        </button>
      </div>
    </div>
  );
}

function composePrompt(project, shot, character, scene) {
  if (!shot) return "";
  const lines = [
    `${project.platform}，${project.title}，${shot.episode}，镜头 ${shot.no}：${shot.title}`,
    `整体风格：${project.style}`,
    character ? `角色：${character.name}，${character.role}，${character.description}` : "",
    scene ? `场景：${scene.name}，${scene.description}` : "",
    `镜别：${shot.shotType}`,
    `运镜：${shot.cameraMove}`,
    `动作：${shot.action}`,
    `情绪表演：${shot.emotion}`,
    shot.dialogue ? `台词/旁白：${shot.dialogue}` : "",
    shot.firstFramePrompt ? `首帧画面：${shot.firstFramePrompt}` : "",
    shot.lastFramePrompt ? `尾帧画面：${shot.lastFramePrompt}` : "",
    shot.lastFrameUrl ? "视频结束时尽量靠近尾帧画面的角色站位、情绪和构图。" : "",
    `画面要求：真实人物表演，自然动作，电影感灯光，细腻表情，短剧质感`,
    project.negativePrompt ? `避免：${project.negativePrompt}` : ""
  ];
  return lines.filter(Boolean).join("\n");
}

function parseShotDraft(text, shot, workspace) {
  const clean = text.trim();
  const title = extractLabeledValue(clean, ["镜头标题", "标题", "分镜标题"]) || inferTitle(clean, shot.title);
  const action = extractLabeledValue(clean, ["动作", "画面", "内容", "剧情"]) || inferAction(clean);
  const emotion = extractLabeledValue(clean, ["情绪", "情绪表演", "表情"]) || inferEmotion(clean, shot.emotion);
  const dialogue = extractLabeledValue(clean, ["台词", "旁白", "对白"]) || inferDialogue(clean, shot.dialogue);
  const shotType = extractLabeledValue(clean, ["镜别", "景别"]) || inferShotType(clean, shot.shotType);
  const cameraMove = extractLabeledValue(clean, ["运镜", "镜头运动", "镜头"]) || inferCameraMove(clean, shot.cameraMove);
  const startAction = extractLabeledValue(clean, ["开头动作", "开始动作"]) || shot.start_action || action;
  const endAction = extractLabeledValue(clean, ["结尾动作", "结束动作"]) || shot.end_action || inferEndAction(clean, action);
  const lighting = extractLabeledValue(clean, ["光线", "光线氛围", "灯光"]) || inferLighting(clean, shot.lighting);
  const sceneState = extractLabeledValue(clean, ["场景状态", "场景环境"]) || shot.scene;
  const characterState = extractLabeledValue(clean, ["人物状态", "人物及服装状态", "服装状态"]) || shot.characters;
  const continuityNote = extractLabeledValue(clean, ["衔接说明", "连续性说明"]) || shot.continuity_note;
  const duration = extractDuration(clean) || shot.duration;
  const ratio = extractRatio(clean) || shot.ratio;
  const characterId = inferCollectionId(clean, workspace.characters, shot.characterId);
  const sceneId = inferCollectionId(clean, workspace.scenes, shot.sceneId);
  const camera = `${shotType || shot.shotType || ""}，${cameraMove || shot.cameraMove || ""}`.replace(/^，|，$/g, "");

  return {
    draftPrompt: clean,
    title,
    action,
    emotion,
    dialogue,
    shotType,
    cameraMove,
    start_action: startAction,
    end_action: endAction,
    lighting,
    scene: sceneState,
    characters: characterState,
    continuity_note: continuityNote,
    duration,
    ratio,
    characterId,
    sceneId,
    camera
  };
}

function extractLabeledValue(text, labels) {
  for (const label of labels) {
    const pattern = new RegExp(`${label}\\s*[：:]\\s*([^\\n。；;]+)`);
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return "";
}

function inferTitle(text, fallback) {
  const firstLine = text.split(/\n/).map((line) => line.trim()).find(Boolean) || "";
  const compact = firstLine.replace(/^(镜头|分镜)\d*[：:、.\\s]*/, "");
  return compact.slice(0, 12) || fallback || "新镜头";
}

function inferAction(text) {
  const withoutLabels = text
    .replace(/(镜头标题|标题|镜别|景别|运镜|情绪|台词|旁白|对白|比例|时长|光线|场景状态|人物状态|开头动作|结尾动作)[：:][^\n。；;]+/g, "")
    .trim();
  return withoutLabels.split(/[。；;\n]/).map((part) => part.trim()).find((part) => part.length > 4) || text.slice(0, 120);
}

function inferEmotion(text, fallback) {
  const keywords = ["惊慌", "紧张", "疑惑", "愤怒", "克制", "悲伤", "崩溃", "害怕", "冷静", "压迫感", "温柔", "释然"];
  return keywords.find((keyword) => text.includes(keyword)) || fallback || "情绪自然，有细微变化";
}

function inferDialogue(text, fallback) {
  const quote = text.match(/[“\"]([^”\"]{2,80})[”\"]/);
  return quote?.[1]?.trim() || fallback || "";
}

function inferShotType(text, fallback) {
  const types = ["大远景", "远景", "全景", "中景", "中近景", "近景", "特写", "大特写", "空镜"];
  return types.find((type) => text.includes(type)) || fallback || "中景";
}

function inferCameraMove(text, fallback) {
  const moves = ["缓慢推镜", "推镜", "拉镜", "横移跟拍", "跟拍", "手持轻微晃动", "手持", "固定机位", "摇镜", "俯拍", "仰拍", "环绕"];
  return moves.find((move) => text.includes(move)) || fallback || "固定机位";
}

function inferEndAction(text, action) {
  const parts = text.split(/[。；;\n]/).map((part) => part.trim()).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : action;
}

function inferLighting(text, fallback) {
  const lightingWords = ["冷色", "暖色", "霓虹", "雨夜", "逆光", "侧光", "顶光", "昏暗", "柔光", "强光", "便利店暖光"];
  const matched = lightingWords.filter((word) => text.includes(word));
  return matched.length ? matched.join("，") : fallback || "";
}

function extractDuration(text) {
  const match = text.match(/(\\d+)\\s*秒/);
  return match?.[1] && ["5", "10"].includes(match[1]) ? match[1] : "";
}

function extractRatio(text) {
  const match = text.match(/(9:16|16:9|1:1)/);
  return match?.[1] || "";
}

function inferCollectionId(text, collection, fallback) {
  return collection.find((item) => text.includes(item.name))?.id || fallback || collection[0]?.id || "";
}

function buildContinuityPrompt(previousShot, currentShot) {
  if (!currentShot) return "";
  const lines = ["镜头连续性要求："];

  if (previousShot) {
    lines.push("延续上一镜头的场景、人物服装、光线和情绪。");
    if (previousShot.characters) lines.push(`上一镜头人物状态：${previousShot.characters}`);
    if (previousShot.scene) lines.push(`上一镜头场景环境：${previousShot.scene}`);
    if (previousShot.emotion) lines.push(`上一镜头情绪状态：${previousShot.emotion}`);
    if (previousShot.lighting) lines.push(`上一镜头光线风格：${previousShot.lighting}`);
    if (previousShot.end_action || previousShot.action) lines.push(`上一镜头结尾动作：${previousShot.end_action || previousShot.action}`);
  } else {
    lines.push("这是本组分镜的第一镜头，需要清楚建立人物、场景、光线和情绪基调。");
  }

  if (currentShot.start_action) lines.push(`本镜头从这个动作开始：${currentShot.start_action}`);
  if (currentShot.end_action) lines.push(`本镜头结尾动作：${currentShot.end_action}`);
  if (currentShot.characters) lines.push(`本镜头人物状态保持：${currentShot.characters}`);
  if (currentShot.scene) lines.push(`本镜头场景保持：${currentShot.scene}`);
  if (currentShot.camera) lines.push(`本镜头镜头距离和运镜：${currentShot.camera}`);
  if (currentShot.lighting) lines.push(`本镜头光线氛围：${currentShot.lighting}`);
  if (currentShot.continuity_note) lines.push(`衔接说明：${currentShot.continuity_note}`);
  if (currentShot.bridge_needed) lines.push("如果上下镜头跳切明显，使用特写或环境过渡镜头语言弱化跳跃感。");
  lines.push("人物外观、服装、发型、道具、空间方向和光线必须保持一致，动作从上一镜头自然接上。");

  return lines.join("\n");
}

function inferContinuityFields(previousShot, currentShot, character, scene) {
  return {
    scene: currentShot.scene || scene?.description || previousShot?.scene || "",
    characters: currentShot.characters || (character ? `${character.name}：${character.description}` : previousShot?.characters || ""),
    camera: currentShot.camera || `${currentShot.shotType || ""}，${currentShot.cameraMove || ""}`.replace(/^，|，$/g, ""),
    lighting: currentShot.lighting || previousShot?.lighting || "延续上一镜头光线氛围",
    start_action: currentShot.start_action || buildStartAction(previousShot, currentShot),
    end_action: currentShot.end_action || currentShot.action || "",
    continuity_note: currentShot.continuity_note || buildContinuityNote(previousShot, currentShot),
    bridge_needed: currentShot.bridge_needed || shouldSuggestBridge(previousShot, currentShot)
  };
}

function buildStartAction(previousShot, currentShot) {
  if (!previousShot) return currentShot.action || "";
  const previousEnd = previousShot.end_action || previousShot.action || "上一镜头动作";
  return `接上一镜头，${previousEnd}之后，${currentShot.action || "人物继续当前动作"}`;
}

function buildContinuityNote(previousShot, currentShot) {
  if (!previousShot) return "第一镜头，建立人物、场景和情绪基调。";
  return `上一镜头的结尾动作“${previousShot.end_action || previousShot.action || "未填写"}”成为本镜头开头动作参考。`;
}

function shouldSuggestBridge(previousShot, currentShot) {
  if (!previousShot) return false;
  return previousShot.sceneId !== currentShot.sceneId || previousShot.characterId !== currentShot.characterId || previousShot.bridge_needed || false;
}

function buildBridgeShot(previousShot, currentShot, project) {
  const bridgeType = suggestBridgeType(previousShot, currentShot);
  const id = `shot-bridge-${Date.now()}`;
  const previousEnd = previousShot?.end_action || previousShot?.action || "上一镜头动作结束";
  const currentStart = currentShot.start_action || currentShot.action || "下一镜头动作开始";
  return {
    ...currentShot,
    id,
    no: `${currentShot.no}A`,
    title: `${bridgeType}桥接`,
    shotType: bridgeType,
    cameraMove: bridgeType.includes("空镜") || bridgeType.includes("环境") ? "固定机位或轻微横移" : "短促特写，轻微推近",
    action: `${previousEnd}之后，用${bridgeType}过渡到：${currentStart}`,
    start_action: `接上一镜头，${previousEnd}`,
    end_action: `过渡到下一镜头，${currentStart}`,
    emotion: previousShot?.emotion || currentShot.emotion || "情绪延续",
    scene: previousShot?.scene || currentShot.scene || "",
    characters: previousShot?.characters || currentShot.characters || "",
    camera: bridgeType,
    lighting: previousShot?.lighting || currentShot.lighting || project.style,
    continuity_note: `桥接镜头：用${bridgeType}掩盖上一镜头到下一镜头的跳切感。`,
    bridge_needed: false,
    dialogue: "",
    duration: "5",
    status: "draft",
    taskId: "",
    localUrl: "",
    originalPrompt: "",
    finalPrompt: "",
    videoPath: "",
    firstFramePrompt: "",
    firstFrameUrl: "",
    firstFrameSourceUrl: "",
    firstFrameStatus: "draft",
    lastFramePrompt: "",
    lastFrameUrl: "",
    lastFrameSourceUrl: "",
    lastFrameStatus: "draft"
  };
}

function suggestBridgeType(previousShot, currentShot) {
  if (!previousShot) return "环境过渡镜头";
  if (previousShot.sceneId !== currentShot.sceneId) return "空镜头";
  if (previousShot.characterId !== currentShot.characterId) return "玻璃倒影";
  if ((currentShot.emotion || "").includes("惊") || (currentShot.emotion || "").includes("紧张")) return "眼神特写";
  return BRIDGE_TYPES[Math.floor(Math.random() * BRIDGE_TYPES.length)];
}

function renumberShots(shots) {
  return shots.map((shot, index) => ({ ...shot, no: String(index + 1).padStart(3, "0") }));
}

function defaultFramePrompt(frameType, shot, character, scene, project) {
  const isFirst = frameType === "first";
  return [
    `${project.title}，${shot.episode}，镜头 ${shot.no}「${shot.title}」${isFirst ? "首帧" : "尾帧"}`,
    character ? `角色：${character.name}，${character.description}` : "",
    scene ? `场景：${scene.name}，${scene.description}` : "",
    isFirst ? `开始画面：${shot.action}` : `结束画面：${shot.emotion}，保留剧情动作后的结果状态`,
    `镜别：${shot.shotType}，运镜参考：${shot.cameraMove}`,
    `风格：${project.style}`,
    "真实人物，电影感灯光，竖屏短剧构图，画面干净，无字幕，无文字"
  ]
    .filter(Boolean)
    .join("\n");
}

function buildCharacterImagePrompt(draft, project) {
  return [
    `为 AI 短剧《${project.title}》生成角色定妆图。`,
    `角色名：${draft.name || "未命名角色"}`,
    `身份：${draft.role || "重要角色"}`,
    `角色描述：${draft.description || draft.idea}`,
    `整体风格：${project.style}`,
    "画面要求：单人半身或中近景，正面或三分之二侧脸，五官清晰，发型服装明确，真实人物，电影感灯光，可作为后续分镜人物一致性参考。",
    "不要字幕，不要文字，不要水印，不要多人同框，不要夸张卡通风。"
  ].join("\n");
}

function buildSceneImagePrompt(draft, project) {
  return [
    `为 AI 短剧《${project.title}》生成场景概念图。`,
    `场景名：${draft.name || "未命名场景"}`,
    `场景描述：${draft.description || draft.idea}`,
    `整体风格：${project.style}`,
    "画面要求：宽一点的环境建立镜头，空间结构清楚，时间、天气、灯光、色调和关键道具明确，真实电影感，可作为后续分镜场景一致性参考。",
    "不要人物特写，不要字幕，不要文字，不要水印，不要夸张卡通风。"
  ].join("\n");
}

function composeRevisionPrompt(basePrompt, revision, shot) {
  return [
    basePrompt,
    "",
    "返修要求：基于上一版生成结果进行修改，保持同一分镜的角色、场景、剧情连续性。",
    `当前分镜：镜头 ${shot.no}，${shot.title}`,
    `需要修改：${revision}`,
    "保留：原有角色身份、主要场景、剧情动作和短剧风格。",
    "强化：人物一致性、表情自然、动作连贯、镜头稳定、画面干净。"
  ].join("\n");
}

function composeFrameRevisionPrompt(basePrompt, revision, frameType, shot) {
  return [
    basePrompt,
    "",
    `关键帧返修：基于上一版${frameType === "first" ? "首帧" : "尾帧"}生成新版。`,
    `当前分镜：镜头 ${shot.no}，${shot.title}`,
    `需要修改：${revision}`,
    "保留：原角色、原场景、原短剧风格、竖屏构图。",
    "强化：人物一致性、表情自然、画面干净、无字幕、无文字、无水印。"
  ].join("\n");
}

function defaultRevisionNote(shot, character, scene) {
  return [
    `保留镜头 ${shot.no}「${shot.title}」的剧情和构图方向。`,
    character ? `保持角色 ${character.name} 的外貌、服装和气质一致。` : "保持角色外貌和气质一致。",
    scene ? `保持场景「${scene.name}」的空间和光线氛围。` : "保持场景空间和光线氛围。",
    "请重点修改：人物表情更自然，动作更连贯，镜头更稳定，不要字幕和多余文字。"
  ].join("\n");
}

function defaultFrameRevisionNote(frameType, shot) {
  return [
    `保留镜头 ${shot.no}「${shot.title}」的${frameType === "first" ? "首帧" : "尾帧"}构图方向。`,
    "请修改：人物脸部更稳定，表情更自然，画面更干净，不要字幕、文字和水印。",
    frameType === "first" ? "首帧要更像镜头开始前的定格画面。" : "尾帧要更像动作结束后的定格画面。"
  ].join("\n");
}

function statusText(status) {
  const map = {
    draft: "草稿",
    submitting: "提交中",
    processing: "生成中",
    completed: "已完成",
    failed: "失败",
    generating: "生成中",
    ready: "已就绪"
  };
  return map[status] || status || "草稿";
}

function frameStatusText(status) {
  const map = {
    draft: "未生成",
    generating: "生成中",
    ready: "已就绪",
    failed: "失败"
  };
  return map[status] || "未生成";
}

function ratioClassName(ratio) {
  if (ratio === "16:9") return "landscape";
  if (ratio === "1:1") return "square";
  return "portrait";
}

function removeKey(object, key) {
  const next = { ...object };
  delete next[key];
  return next;
}

function taskProgress(task, now) {
  const elapsedSeconds = Math.max(0, Math.floor((now - task.startedAt) / 1000));
  const timeProgress = Math.min(88, Math.floor((elapsedSeconds / ESTIMATED_VIDEO_SECONDS) * 88));
  const checkProgress = Math.min(7, task.checks);
  return Math.min(95, 5 + timeProgress + checkProgress);
}

function frameProgress(task, now) {
  const elapsedSeconds = Math.max(0, Math.floor((now - task.startedAt) / 1000));
  return Math.min(96, 8 + Math.floor((elapsedSeconds / ESTIMATED_FRAME_SECONDS) * 88));
}

function guessCharacterName(idea, count) {
  const known = ["林夏", "顾沉", "苏念", "江屿", "沈清", "许砚", "周晚", "陆衡"];
  const match = idea.match(/[，,：:\s]([\u4e00-\u9fa5]{2,4})(?:，|,|。|\s|$)/);
  return match?.[1] || known[count % known.length] || `角色${count + 1}`;
}

function guessSceneName(idea, count) {
  const parts = ["便利店门口", "出租屋", "医院走廊", "公司会议室", "雨夜街头", "地下停车场"];
  const matched = parts.find((part) => idea.includes(part));
  return matched || `场景${count + 1}`;
}

function getAvailableReferenceFrames(shot, character, scene) {
  const frames = [];
  if (character?.imageSourceUrl) {
    frames.push({
      value: "character",
      label: `${character.name}角色图`,
      localUrl: character.imageUrl,
      sourceUrl: character.imageSourceUrl
    });
  }
  if (scene?.imageSourceUrl) {
    frames.push({
      value: "scene",
      label: `${scene.name}场景图`,
      localUrl: scene.imageUrl,
      sourceUrl: scene.imageSourceUrl
    });
  }
  if (shot.firstFrameSourceUrl) {
    frames.push({
      value: "first",
      label: "首帧",
      localUrl: shot.firstFrameUrl,
      sourceUrl: shot.firstFrameSourceUrl
    });
  }
  if (shot.lastFrameSourceUrl) {
    frames.push({
      value: "last",
      label: "尾帧",
      localUrl: shot.lastFrameUrl,
      sourceUrl: shot.lastFrameSourceUrl
    });
  }
  return frames;
}

function getReferenceFrame(shot, selectedValue, character, scene) {
  const frames = getAvailableReferenceFrames(shot, character, scene);
  return frames.find((frame) => frame.value === selectedValue) || frames.find((frame) => frame.value === "first") || frames[0] || null;
}

function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes === 0) return `${rest} 秒`;
  return `${minutes} 分 ${String(rest).padStart(2, "0")} 秒`;
}

function loadAppState() {
  try {
    const cached = window.localStorage.getItem(STORAGE_KEY);
    return normalizeAppState(cached ? JSON.parse(cached) : defaultWorkspace);
  } catch {
    return normalizeAppState(defaultWorkspace);
  }
}

function normalizeAppState(value) {
  if (value?.version === APP_STORAGE_VERSION && Array.isArray(value.projects)) {
    const projects = value.projects.map((project) => ({
      id: project.id || `project-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: project.createdAt || new Date().toISOString(),
      updatedAt: project.updatedAt || new Date().toISOString(),
      workspace: normalizeWorkspace(project.workspace || defaultWorkspace)
    }));
    const activeProjectId = projects.some((project) => project.id === value.activeProjectId) ? value.activeProjectId : projects[0]?.id;
    return { version: APP_STORAGE_VERSION, activeProjectId, projects: projects.length ? projects : [createProjectEntry(defaultWorkspace)] };
  }

  const migratedWorkspace = normalizeWorkspace(value?.project && value?.shots ? value : defaultWorkspace);
  const project = createProjectEntry(migratedWorkspace);
  return {
    version: APP_STORAGE_VERSION,
    activeProjectId: project.id,
    projects: [project]
  };
}

function createProjectEntry(workspace) {
  const now = new Date().toISOString();
  return {
    id: `project-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: now,
    updatedAt: now,
    workspace: normalizeWorkspace(workspace)
  };
}

function getActiveWorkspace(appState) {
  return appState.projects.find((project) => project.id === appState.activeProjectId)?.workspace || appState.projects[0]?.workspace || normalizeWorkspace(defaultWorkspace);
}

function updateActiveWorkspace(appState, updater) {
  return {
    ...appState,
    projects: appState.projects.map((project) => {
      if (project.id !== appState.activeProjectId) return project;
      const nextWorkspace = typeof updater === "function" ? updater(project.workspace) : updater;
      return {
        ...project,
        updatedAt: new Date().toISOString(),
        workspace: normalizeWorkspace(nextWorkspace)
      };
    })
  };
}

function createBlankWorkspace(title) {
  return normalizeWorkspace({
    ...defaultWorkspace,
    project: {
      ...defaultWorkspace.project,
      title
    },
    characters: [],
    scenes: [],
    shots: []
  });
}

function cloneWorkspaceForProject(workspace, title) {
  const suffix = Date.now();
  return normalizeWorkspace({
    ...workspace,
    project: { ...workspace.project, title },
    characters: workspace.characters.map((character) => ({ ...character, id: `${character.id}-copy-${suffix}` })),
    scenes: workspace.scenes.map((scene) => ({ ...scene, id: `${scene.id}-copy-${suffix}` })),
    shots: workspace.shots.map((shot) => ({
      ...shot,
      id: `${shot.id}-copy-${suffix}`,
      status: "draft",
      taskId: "",
      localUrl: "",
      videoPath: ""
    }))
  });
}

function filterRecordsForProject(records, projectId, projectTitle) {
  return records.filter((record) => {
    if (record.metadata?.projectId) return record.metadata.projectId === projectId;
    return !record.metadata?.projectTitle || record.metadata.projectTitle === projectTitle;
  });
}

function normalizeWorkspace(workspace) {
  return {
    ...workspace,
    characters: (workspace.characters || []).map((character) => ({
      imageUrl: "",
      imageSourceUrl: "",
      imageStatus: "draft",
      ...character
    })),
    scenes: (workspace.scenes || []).map((scene) => ({
      imageUrl: "",
      imageSourceUrl: "",
      imageStatus: "draft",
      ...scene
    })),
    shots: (workspace.shots || []).map((shot) => ({
      draftPrompt: "",
      scene: "",
      characters: "",
      camera: shot.camera || `${shot.shotType || ""}，${shot.cameraMove || ""}`.replace(/^，|，$/g, ""),
      lighting: "",
      start_action: shot.start_action || shot.action || "",
      end_action: "",
      continuity_note: "",
      bridge_needed: false,
      originalPrompt: "",
      finalPrompt: "",
      videoPath: "",
      firstFramePrompt: "",
      firstFrameUrl: "",
      firstFrameSourceUrl: "",
      firstFrameStatus: "draft",
      lastFramePrompt: "",
      lastFrameUrl: "",
      lastFrameSourceUrl: "",
      lastFrameStatus: "draft",
      ...shot
    }))
  };
}

function formatApiError(json, fallback) {
  const detail = json?.detail;
  const detailMessage =
    detail?.error?.message ||
    detail?.message ||
    detail?.error_message ||
    detail?.raw ||
    (typeof detail === "string" ? detail : "");
  return [json?.error || fallback, detailMessage].filter(Boolean).join("\n");
}

async function fetchAssetBlob(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("首帧图读取失败，无法作为参考图。");
  return await response.blob();
}

createRoot(document.getElementById("root")).render(<App />);
