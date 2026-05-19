# Seedance AI Video Studio

这是一个给新手使用的本地 AI 视频创作平台示例，技术栈是 Node.js、Express、React、Vite。API Key 只放在后端 `.env` 里，前端页面不会拿到你的 Key。

## 1. 环境安装

先安装这些工具：

1. Node.js：建议安装 LTS 或较新版本。你当前机器已经有 Node.js。
2. Codex：你现在正在使用的就是 Codex，可以让它帮你创建文件、改代码、运行命令。
3. Seedance API Key：放在 `.env`，不要写进代码。

检查命令：

```bash
node -v
npm -v
```

## 2. 项目创建

本项目已经创建在：

```bash
/Users/apple/seedance-ai-video-studio
```

如果你自己从零创建，可以执行：

```bash
cd /Users/apple
mkdir seedance-ai-video-studio
cd seedance-ai-video-studio
npm init -y
```

当前项目结构：

```text
seedance-ai-video-studio/
  client/src/          前端 React 页面
  server/index.js      后端 Express 服务，负责调用 Seedance API
  outputs/             自动下载的视频会保存到这里
  .env.example         环境变量模板
  package.json         依赖和运行脚本
```

## 3. 安装依赖

进入项目目录：

```bash
cd /Users/apple/seedance-ai-video-studio
npm install
```

如果你的电脑提示 npm 缓存权限问题，可以改用项目内缓存：

```bash
npm install --cache ./.npm-cache --registry=https://registry.npmjs.org
```

## 4. 配置 API Key

复制环境变量模板：

```bash
cp .env.example .env
```

然后打开 `.env`，把这一行换成你的真实 Key：

```bash
SEEDANCE_API_KEY=你的_Seedance_API_Key
```

默认配置使用 `seedance2.movie` 文档里的接口：

```bash
SEEDANCE_PROVIDER=seedance2_movie
SEEDANCE_BASE_URL=https://api.seedance2.movie
SEEDANCE_SUBMIT_PATH=/api/v1/video/task
SEEDANCE_STATUS_PATH=/api/v1/video/task
SEEDANCE_UPLOAD_PRESIGN_PATH=/api/v1/video/upload/presign
SEEDANCE_MODEL=seedance-2.0
```

如果你有火山方舟 Seedream 权限，可以配置真实首帧/尾帧图片生成：

```bash
SEEDREAM_API_KEY=你的_Seedream_Ark_API_Key
SEEDREAM_BASE_URL=https://ark.cn-beijing.volces.com
SEEDREAM_MODEL=doubao-seedream-5-0-260128
SEEDREAM_SIZE=2K
```

配置后，分镜里的“生成首帧 / 生成尾帧”会调用 Seedream，并把图片下载到 `outputs/assets`。

如果你的 Key 来自另一个平台，比如 `seedanceapi.org`，需要按对方文档修改：

```bash
SEEDANCE_PROVIDER=seedanceapi_org
SEEDANCE_BASE_URL=https://seedanceapi.org
SEEDANCE_SUBMIT_PATH=/v2/generate
SEEDANCE_STATUS_PATH=/v2/status
```

注意：不同平台的 Seedance 网关字段可能不同。如果接口返回字段变了，主要改 `server/index.js` 里的 `seedance2MovieProvider()` 或 `seedanceApiOrgProvider()`。

## 5. 运行项目

开发模式运行：

```bash
cd /Users/apple/seedance-ai-video-studio
npm run dev
```

然后打开：

```text
http://localhost:5173
```

后端服务地址是：

```text
http://localhost:3001
```

检查后端是否启动：

```bash
curl http://localhost:3001/api/health
```

你应该能看到：

```json
{
  "ok": true,
  "provider": "seedance2_movie",
  "hasApiKey": true
}
```

## 6. 如何生成视频

1. 在网页里输入提示词。
2. 可选：上传参考图。
3. 选择时长、比例、清晰度。
4. 点击“生成视频”。
5. 前端会自动轮询任务状态。
6. 后端检测到任务完成后，会自动下载视频到 `outputs` 文件夹。

本地视频路径类似：

```text
/Users/apple/seedance-ai-video-studio/outputs/任务ID-时间戳.mp4
```

## 7. Codex 如何使用

你可以这样对 Codex 说：

```text
帮我启动这个项目，并告诉我打开哪个地址。
```

```text
帮我把提示词表单加一个“角色名”和“场景编号”。
```

```text
帮我把生成记录保存到本地 JSON 文件，方便做短剧工作流。
```

```text
帮我排查 Seedance API 报错，把错误信息翻译成我能看懂的话。
```

## 8. 后续短剧工作流扩展方向

可以逐步加这些模块：

1. 角色库：通过角色描述生成角色草稿和定妆图，确认后保存复用。
2. 场景库：通过场景描述生成场景草稿和概念图，确认后保存复用。
3. 分镜表：每集拆成多个镜头，每个镜头有提示词、时长、比例。
4. 批量生成：按分镜一条条提交任务。
5. 结果管理：保存 task_id、提示词、本地视频路径、生成时间。
6. 剪辑导出：把多个视频片段交给 ffmpeg 合成。

先把单条视频生成跑通，再扩展，会更稳。

## 9. 镜头连续性管理

## 多项目管理

顶部 `当前项目` 可以切换不同短剧。常用操作：

```text
新建项目：创建一部新的短剧，角色库、场景库、分镜表从空白开始。
复制项目：把当前项目复制成一部新短剧，适合做同类型剧或保留模板。
删除项目：删除当前项目，至少会保留一个项目。
```

每个项目都有独立的：

```text
项目设置
角色库
场景库
分镜表
连续性信息
首尾帧
```

视频生成完成后会按项目名保存到：

```text
outputs/项目名/
```

旧版单项目数据会自动迁移成第一个项目，不需要手动处理。

每个分镜都有一组连续性字段：

```text
场景状态
人物及服装状态
情绪状态
镜头距离和运镜
光线氛围
开头动作
结尾动作
与上一镜头的衔接说明
是否需要桥接镜头
```

生成某个镜头时，系统会自动读取上一镜头的关键信息，尤其是：

```text
上一镜头的结尾动作
上一镜头的人物外观
上一镜头的情绪
上一镜头的场景环境
上一镜头的光线风格
```

核心规则是：

```text
上一镜头的 end_action，要成为下一镜头 start_action 的参考。
```

例如：

```text
上一镜头结尾动作：林夏回头看向顾沉
下一镜头开头动作：接上一镜头，林夏刚回头，顾沉上前一步靠近她
```

在分镜编辑区点击 `继承上一镜头`，可以自动补全当前镜头的连续性信息。右侧生成面板里的提示词已经是“加入连续性后的最终提示词”。

连续性信息主要解决“文字层面的状态衔接”：人物状态、情绪、动作、场景、光线和运镜如何从上一镜头自然接到下一镜头。

首尾帧主要解决“视觉层面的画面锚点”：首帧用于控制本镜头开始画面，尾帧用于规划本镜头结束画面。两者建议同时保留：

```text
连续性信息：告诉模型上一镜头发生了什么、下一镜头从哪里接。
首尾帧：给模型更直观的画面参考，尤其用于人物和场景一致性。
```

## 10. 桥接镜头

如果两个镜头之间衔接生硬，可以在当前分镜的 `连续性信息` 区点击：

```text
插入桥接镜头
```

系统会在当前镜头前插入一个短桥接镜头。桥接类型包括：

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

桥接镜头的作用是掩盖 AI 视频片段之间的跳跃感，比如从人物特写切到车门、雨水、手部、玻璃倒影，再进入下一镜头。

## 11. 批量生成连续镜头

当前版本建议按顺序生成，而不是一次性整集提交：

```text
先在“分镜草稿 / 自然语言提示词”里写镜头描述 -> 点击“解析到字段”
第 001 镜：选择角色图/场景图 -> 检查连续性字段 -> 生成首帧 -> 生成视频
第 002 镜：点击“继承上一镜头” -> 检查开头动作 -> 生成首帧 -> 生成视频
第 003 镜：如果跳切明显，先插入桥接镜头 -> 再生成当前镜头
```

这样每个镜头都会参考上一镜头状态，更容易保持人物、动作、情绪、场景和光线的一致性。

每次生成会保存：

```text
原始提示词
加入连续性后的最终提示词
生成状态
任务 ID
本地视频路径
```

生成记录保存在：

```text
data/generation-records.json
```

## 12. 导入剪映拼接

生成的视频保存在：

```text
outputs/
```

建议按分镜顺序导入剪映：

```text
001 主镜头
002 桥接镜头
003 主镜头
004 主镜头
```

剪辑建议：

```text
桥接镜头通常保留 0.5-1.5 秒
主镜头按剧情节奏保留 3-5 秒
跳切明显的地方用眼神、手部、脚步、空镜压一下
台词和字幕最后统一加
```
