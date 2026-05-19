# PROJECT_CONTEXT

本文件用于在新会话中快速恢复项目上下文。不要在这里写真实 API Key；真实配置只放在本地 `.env`。

## 1. 当前项目目标

本项目是一个本地运行的 AI 短剧视频创作工作台，目标是做一个简化版 LibTV 工作流：

- 通过网页界面管理多部短剧项目。
- 每个项目独立维护角色库、场景库、分镜表、连续性信息、首尾帧和生成记录。
- 通过火山方舟 Seedance 2.0 生成分镜视频。
- 通过 Seedream 生成角色定妆图、场景概念图、首帧和尾帧。
- 自动轮询 Seedance 视频任务状态。
- 自动下载生成视频到本地 `outputs/项目名/`。
- 支持后续扩展为更完整的 AI 短剧工作流。

当前定位：本地工具优先，不是纯 GitHub Pages 在线工具。GitHub Pages 只能展示前端静态界面，真实生成必须本地运行后端。

## 2. 技术架构

技术栈：

- Node.js
- Express
- React
- Vite
- `.env` 管理 API Key
- 本地文件系统保存输出视频、图片和生成记录

运行方式：

```bash
npm install
npm run dev
```

服务结构：

- 前端：Vite dev server，默认 `http://localhost:5173/`
- 后端：Express server，默认 `http://localhost:3001/`
- Vite 代理：
  - `/api` -> `http://localhost:3001`
  - `/outputs` -> `http://localhost:3001`

数据保存：

- 工作台项目数据：浏览器 `localStorage`，key 为 `seedance-libtv-workflow-v1`
- 生成记录：`data/generation-records.json`
- 视频输出：`outputs/项目名/`
- 图片资产：`outputs/assets/`

## 3. Seedance API 接入方式

配置文件：

- `.env.example` 提供模板。
- `.env` 存放真实 Key，不提交 Git。

主要环境变量：

```text
SEEDANCE_PROVIDER=volcengine_ark
SEEDANCE_API_KEY=...
SEEDANCE_BASE_URL=https://ark.cn-beijing.volces.com
SEEDANCE_SUBMIT_PATH=/api/v3/contents/generations/tasks
SEEDANCE_STATUS_PATH=/api/v3/contents/generations/tasks
SEEDANCE_MODEL=doubao-seedance-2-0-fast-260128

SEEDREAM_API_KEY=...
SEEDREAM_BASE_URL=https://ark.cn-beijing.volces.com
SEEDREAM_MODEL=doubao-seedream-5-0-260128
SEEDREAM_SIZE=2K
```

后端入口：

- `POST /api/generate`
  - 提交 Seedance 视频任务。
  - 接收 prompt、duration、aspectRatio、resolution、generateAudio、firstFrameUrl、lastFrameUrl、metadata。
  - metadata 中包含 projectId、projectTitle、episode、shotNo、shotTitle、character、scene、originalPrompt、finalPrompt 等。

- `GET /api/tasks/:taskId`
  - 查询 Seedance 任务状态。
  - 若任务完成，则下载视频到 `outputs/项目名/`。
  - 更新 `data/generation-records.json`。

- `POST /api/frames/generate`
  - 调用 Seedream 生成角色图、场景图、首帧、尾帧。
  - 返回本地图片地址和可供 Ark 使用的 sourceUrl。

重要实现：

- `server/index.js`
  - `volcengineArkProvider()`
  - `generateFrameAsset()`
  - `generateSeedreamFrameAsset()`
  - `downloadVideo()`
  - `normalizeStatus()`
  - `requestJson()`

Ark 图生视频注意：

- 火山方舟 Seedance 图生视频需要公网 HTTPS 图片 URL。
- 本地上传图通常不能直接给 Ark 使用。
- 推荐优先使用 Seedream 生成的角色图、场景图或首帧，因为这些会有可用的 sourceUrl。

## 4. 分镜结构

每个 shot 大致包含：

```js
{
  id,
  episode,
  no,
  title,
  draftPrompt,
  characterId,
  sceneId,
  shotType,
  cameraMove,
  action,
  emotion,
  dialogue,
  duration,
  ratio,
  status,
  taskId,
  localUrl,
  videoPath,

  scene,
  characters,
  camera,
  lighting,
  start_action,
  end_action,
  continuity_note,
  bridge_needed,

  originalPrompt,
  finalPrompt,

  firstFramePrompt,
  firstFrameUrl,
  firstFrameSourceUrl,
  firstFrameStatus,
  lastFramePrompt,
  lastFrameUrl,
  lastFrameSourceUrl,
  lastFrameStatus
}
```

关键点：

- `draftPrompt` 是自然语言分镜草稿。
- 点击“解析到字段”后，由 `parseShotDraft()` 尽量拆到镜别、运镜、动作、情绪、台词、开头动作、结尾动作等字段。
- `originalPrompt` 保存原始提示词。
- `finalPrompt` 保存加入连续性后的最终提示词。
- `status` 包括 `draft`、`submitting`、`processing`、`completed`、`failed`。

## 5. 镜头连续性系统

连续性字段：

```text
scene：场景状态
characters：人物及服装状态
emotion：当前情绪
camera：镜头距离和运镜
lighting：光线氛围
start_action：本镜头开头动作
end_action：本镜头结尾动作
continuity_note：与上一镜头的衔接说明
bridge_needed：是否需要桥接镜头
```

核心规则：

```text
上一镜头的 end_action，要成为下一镜头 start_action 的参考。
```

主要函数：

- `buildContinuityPrompt(previousShot, currentShot)`
  - 自动生成视频模型更容易理解的连续性提示词。
  - 会加入上一镜头人物状态、场景环境、情绪状态、光线风格、结尾动作。

- `inferContinuityFields(previousShot, currentShot, character, scene)`
  - 点击“继承上一镜头”时使用。
  - 自动补全当前镜头的连续性字段。

- `buildStartAction(previousShot, currentShot)`
  - 用上一镜头结尾动作生成当前镜头开头动作。

- `buildContinuityNote(previousShot, currentShot)`
  - 生成文字衔接说明。

连续性信息和首尾帧的关系：

- 连续性信息解决“文字层面的状态衔接”。
- 首尾帧解决“视觉层面的画面锚点”。
- 两者都保留，有交集但职责不同。

## 6. 桥接镜头逻辑

桥接镜头用于掩盖 AI 生成片段之间的跳切感。

桥接类型：

```text
手部特写
眼神特写
呼吸特写
背影
玻璃倒影
衣角/脚步特写
空镜头
环境过渡镜头
```

主要函数：

- `buildBridgeShot(previousShot, currentShot, project)`
  - 在当前镜头前插入桥接镜头。
  - 会继承上一镜头和当前镜头的场景、角色、情绪、光线等信息。

- `suggestBridgeType(previousShot, currentShot)`
  - 根据场景变化、角色变化、情绪关键词自动选择桥接类型。

- `shouldSuggestBridge(previousShot, currentShot)`
  - 判断是否建议桥接。

当前逻辑：

- 场景变化时优先空镜头。
- 角色变化时优先玻璃倒影。
- 情绪包含惊慌或紧张时优先眼神特写。
- 否则随机选择桥接类型。

## 7. 当前已完成功能

项目管理：

- 多项目切换。
- 新建项目。
- 复制项目。
- 删除项目。
- 旧单项目数据自动迁移成第一个项目。

角色库：

- 通过角色描述生成角色草稿。
- 自动生成角色定妆图。
- 修改确认后保存角色。
- 分镜可选择角色。
- 角色图可作为生成视频的参考图。

场景库：

- 通过场景描述生成场景草稿。
- 自动生成场景概念图。
- 修改确认后保存场景。
- 分镜可选择场景。
- 场景图可作为生成视频的参考图。

分镜表：

- 新增分镜。
- 删除分镜。
- 选择分镜编辑。
- 分镜草稿 / 自然语言提示词。
- 本地解析草稿到结构化字段。
- 编辑镜头标题、编号、角色、场景、时长、镜别、运镜、比例、动作、情绪、台词。

连续性：

- 继承上一镜头。
- 编辑开头动作、结尾动作、人物状态、场景状态、光线氛围、衔接说明。
- 自动构建最终连续性提示词。

首尾帧：

- 生成首帧。
- 生成尾帧。
- 上传首帧 / 尾帧。
- 返修首帧 / 尾帧。
- 首尾帧生成进度条。

视频生成：

- 生成当前镜头。
- 生成音频默认开启。
- 自动轮询任务状态。
- 手动刷新状态。
- 停止等待改回草稿。
- 自动下载完成视频。
- 基于当前视频返修。
- 返修对话框。
- 生成进度条。

参考图：

- 默认从角色图、场景图、首帧、尾帧中自动选择最佳参考图。
- 本地上传参考图降级到高级选项。
- 可删除本次上传参考图。

发布与分享：

- GitHub 仓库已创建。
- GitHub Pages 已部署静态前端演示版。
- 已生成 Word 使用教程。
- 已生成私下快速启动说明。
- 已生成包含 `.env` 的私密分享 zip，供可信朋友本地运行。

## 8. 下一步 TODO

重要 TODO：

- 增加“导出项目 / 导入项目”功能，方便多设备迁移。
- 增加“批量按顺序生成当前项目所有草稿分镜”功能。
- 增加“批量生成首帧”功能。
- 给角色图、场景图增加返修按钮。
- 给角色库、场景库增加删除按钮。
- 把角色图、场景图、首尾帧统一抽象成 Asset Library。
- 增加“剪映导出清单”，按镜头顺序输出视频列表。
- 增加视频下载路径展示和一键打开 outputs 文件夹。
- 增加项目级清空测试数据功能。
- 增加后端部署方案，支持在线真实生成，而不是只有 GitHub Pages 静态演示。

技术 TODO：

- 现在工作台数据主要存在浏览器 localStorage，后续可迁移到 `data/projects.json`。
- 生成记录目前是全局 `data/generation-records.json`，前端按 projectId/projectTitle 过滤。
- 图片资产仍统一存在 `outputs/assets/`，后续可按项目拆分。
- 本地解析 `parseShotDraft()` 是规则解析，不是 LLM 解析，准确度有限。
- GitHub Pages 只能跑前端，不能跑 Express 后端。

## 9. 关键代码文件说明

### `client/src/main.jsx`

前端主逻辑。包含：

- React App。
- 多项目状态管理。
- localStorage 数据迁移。
- 角色库 / 场景库逻辑。
- 分镜表和分镜编辑。
- 分镜草稿解析。
- 连续性提示词构建。
- 桥接镜头插入。
- 首尾帧生成和上传。
- 视频生成、轮询、返修。

重点函数：

- `App()`
- `loadAppState()`
- `normalizeAppState()`
- `normalizeWorkspace()`
- `parseShotDraft()`
- `composePrompt()`
- `buildContinuityPrompt()`
- `inferContinuityFields()`
- `buildBridgeShot()`
- `generateSelectedShot()`
- `pollTask()`
- `generateFrame()`
- `getAvailableReferenceFrames()`

### `client/src/styles.css`

前端样式。包含：

- 三栏工作台布局。
- 项目切换器。
- 角色库 / 场景库卡片。
- 分镜列表。
- 分镜草稿解析区。
- 连续性编辑区。
- 首尾帧卡片。
- 生成面板。
- 预览比例适配。
- 进度条、弹窗、移动端响应式。

### `server/index.js`

后端 Express 服务。包含：

- `.env` 加载。
- `/api/health`
- `/api/records`
- `/api/assets`
- `/api/frames/generate`
- `/api/generate`
- `/api/tasks/:taskId`
- Seedance provider。
- Seedream 图片生成。
- 视频下载。
- 生成记录读写。

重点函数：

- `getProvider()`
- `volcengineArkProvider()`
- `generateFrameAsset()`
- `generateSeedreamFrameAsset()`
- `downloadVideo()`
- `downloadImageAsset()`
- `readRecords()`
- `appendRecord()`
- `updateRecord()`
- `normalizeStatus()`
- `requestJson()`

### `.env.example`

环境变量模板。不要放真实 Key。

### `.env`

本地真实 Key。已被 `.gitignore` 忽略。不要提交 Git，不要公开分享。

### `README.zh-CN.md`

用户使用说明和项目说明。

### `AI短剧工作流使用教程.docx`

面向用户的 Word 教程。

### `朋友安装说明.md`

不带 Key 的普通分享说明。

### `私下快速启动说明.md`

带 `.env` 私密包里的快速启动说明。

### `.github/workflows/pages.yml`

GitHub Pages 静态前端部署 workflow。只部署前端演示版，不包含真实后端能力。

### `vite.config.js`

Vite 配置：

- React 插件。
- `base: "./"` 适配 GitHub Pages 子路径。
- dev server 代理 `/api` 和 `/outputs` 到 Express 后端。

### `package.json`

脚本：

- `npm run dev`：同时启动后端和前端。
- `npm run server`：只启动 Express。
- `npm run client`：只启动 Vite。
- `npm run build`：构建静态前端。
- `npm run start`：生产模式启动 Express。

## 快速恢复提示

新会话开始时建议先读：

1. `PROJECT_CONTEXT.md`
2. `README.zh-CN.md`
3. `client/src/main.jsx`
4. `server/index.js`

常用验证命令：

```bash
npm run build
npm run dev
```

发布注意：

- GitHub Pages 链接只能展示前端：
  `https://tomo66668.github.io/seedance-ai-video-studio/`
- 真实生成视频必须本地运行或部署到支持 Node 后端的平台。
