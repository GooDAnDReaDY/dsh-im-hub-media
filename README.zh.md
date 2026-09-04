# 📦 @goodandready/dsh-im-hub-media

<div align="center">

<h3>DeepSeek Harness 多平台即时通讯媒体网关（支持语音转写与双向富媒体收发）</h3>

<p align="center">
  <a href="https://www.npmjs.com/package/@goodandready/dsh-im-hub-media"><img src="https://img.shields.io/npm/v/@goodandready/dsh-im-hub-media.svg?style=for-the-badge&color=6366f1&labelColor=1e1b4b" alt="npm version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-10b981.svg?style=for-the-badge&color=10b981&labelColor=064e3b" alt="license"></a>
  <a href="https://github.com/topics/dsh-plugin"><img src="https://img.shields.io/badge/DSH-Plugin-8b5cf6.svg?style=for-the-badge&labelColor=2e1065" alt="DSH Plugin"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node-20%2B-f59e0b.svg?style=for-the-badge&labelColor=451a03" alt="Node version"></a>
</p>

<p align="center">
  <a href="https://goodandready.app/"><img src="https://img.shields.io/badge/作者全部项目-goodandready.app-ff4500.svg?style=for-the-badge&logo=rocket&logoColor=white&labelColor=1a1a2e" alt="作者全部项目"></a>
</p>

<p align="center">
  <a href="README.md"><b>🇬🇧 English</b></a> •
  <a href="README.ru.md"><b>🇷🇺 Русский</b></a> •
  <a href="README.zh.md"><b>🇨🇳 中文说明</b></a>
</p>

</div>

---

## ⚡ 插件概览

**`dsh-im-hub-media`** 将 **DeepSeek Harness** 智能体接入 **Telegram**、**飞书 (Lark)** 与 **企业微信 (WeCom)**，实现 7x24 小时即时通讯交互、语音条自动转写及双向富媒体消息收发。

不同于传统纯文本机器人，本插件全面打通语音条、图片附件、文档以及引用回复 (Replies)，支持智能体通过原生媒体消息（图片、语音条、文件）即时回复用户。

```mermaid
graph LR
    subgraph Users [即时通讯终端]
        TG[Telegram 聊天 / 频道] --> Gateway[IM Hub Media 网关层]
        Lark[飞书 / Lark WebSocket] --> Gateway
        WeCom[企业微信应用 / 机器人] --> Gateway
    end

    subgraph Inbound [入站媒体处理流]
        Gateway --> MediaRouter{媒体类型路由分发}
        MediaRouter -->|语音条 .oga/.ogg/.amr| STT[语音转文字 STT 自动转写]
        MediaRouter -->|图片 / 截图附件| Vision[视觉上下文提取]
        MediaRouter -->|文件 / 文档| Doc[文档解析与内联注入]
        MediaRouter -->|文本与引用消息| Ctx[会话线程上下文装配]
    end

    subgraph DSHCore [DSH 智能体核心]
        STT --> Agent[智能体逻辑推理执行]
        Vision --> Agent
        Doc --> Agent
        Ctx --> Agent
    end

    subgraph Outbound [出站响应下发]
        Agent -->|MEDIA:/path 语法标记| OutRouter{原生媒体分发器}
        OutRouter -->|sendPhoto / sendDocument| Gateway
        OutRouter -->|sendVoice / sendAudio| Gateway
        OutRouter -->|sendText / Markdown| Gateway
    end

    style Users fill:#1e1e2e,stroke:#89b4fa,stroke-width:2px,color:#cdd6f4
    style Inbound fill:#181825,stroke:#cba6f7,stroke-width:2px,color:#cdd6f4
    style DSHCore fill:#11111b,stroke:#a6e3a1,stroke-width:2px,color:#cdd6f4
    style Outbound fill:#181825,stroke:#f38ba8,stroke-width:2px,color:#cdd6f4
```

---

## 📦 安装指南

```bash
dsh plugin --profile web add @goodandready/dsh-im-hub-media
```

---

## 📄 开源协议

MIT © [GooDAnDReaDY](https://github.com/GooDAnDReaDY)
