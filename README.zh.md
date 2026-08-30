# 📦 @goodandready/dsh-im-hub-media

<div align="center">

<h3>DeepSeek Harness 多平台即时通讯媒体网关（支持语音转写与富媒体）</h3>

<p align="center">
  <a href="https://www.npmjs.com/package/@goodandready/dsh-im-hub-media"><img src="https://img.shields.io/npm/v/@goodandready/dsh-im-hub-media.svg?style=for-the-badge&color=6366f1&labelColor=1e1b4b" alt="npm version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/GooDAnDReaDY/dsh-im-hub-media.svg?style=for-the-badge&color=10b981&labelColor=064e3b" alt="license"></a>
  <a href="https://github.com/topics/dsh-plugin"><img src="https://img.shields.io/badge/DSH-Plugin-8b5cf6.svg?style=for-the-badge&labelColor=2e1065" alt="DSH Plugin"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node-20%2B-f59e0b.svg?style=for-the-badge&labelColor=451a03" alt="Node version"></a>
</p>

<p align="center">
  <a href="README.md"><b>🇬🇧 English</b></a> •
  <a href="README.ru.md"><b>🇷🇺 Русский</b></a> •
  <a href="README.zh.md"><b>🇨🇳 中文说明</b></a>
</p>

</div>

---

## ⚡ 插件概览

**`dsh-im-hub-media`** 将 DeepSeek Harness 智能体接入 **Telegram**、**飞书 (Lark)** 与 **企业微信 (WeCom)**，支持语音消息自动识别转写与富媒体收发。

```mermaid
graph LR
    User[👤 Telegram / 飞书 / 企业微信] -->|语音条 / 图片 / 附件| Gateway[dsh-im-hub-media 网关]
    Gateway -->|自动调用 STT 转写| DSH[智能体上下文推理]
    DSH -->|生成文本与文件响应| Gateway
    Gateway -->|消息实时回传| User
```

---

## 📦 安装指南

```bash
dsh plugin --profile web add @goodandready/dsh-im-hub-media
```

---

## 📄 开源协议

MIT © [GooDAnDReaDY](https://github.com/GooDAnDReaDY)
