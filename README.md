# 📦 @goodandready/dsh-im-hub-media

<div align="center">

[![npm version](https://img.shields.io/npm/v/@goodandready/dsh-im-hub-media.svg?style=flat-square)](https://www.npmjs.com/package/@goodandready/dsh-im-hub-media)
[![license](https://img.shields.io/github/license/GooDAnDReaDY/dsh-im-hub-media.svg?style=flat-square)](LICENSE)
[![DSH Plugin](https://img.shields.io/badge/DSH-Plugin-6366f1.svg?style=flat-square)](https://github.com/topics/dsh-plugin)

**[ 🇬🇧 English ](#-english) • [ 🇷🇺 Русский ](#-русский) • [ 🇨🇳 中文 ](#-中文)**

</div>

---

<a name="-english"></a>
## 🇬🇧 English

Multi-platform Instant Messaging gateway for DeepSeek Harness: connect your DSH agent to Telegram, Feishu (Lark), and WeCom with speech-to-text, photos, and document handling.

### Features

- **Supported Platforms**: Telegram Bot API, Feishu/Lark, and Enterprise WeChat (WeCom).
- **Voice Message STT**: Automatically transcribes incoming audio notes to text before feeding to the agent.
- **Media Attachments**: Forwards images, documents, and screenshots seamlessly.
- **Access Control**: Whitelisted Chat IDs and user security barriers.

### Install

```bash
dsh plugin --profile web add @goodandready/dsh-im-hub-media
```

---

<a name="-русский"></a>
<details open>
<summary><h2>🇷🇺 Русский (Полное руководство)</h2></summary>

Мультиплатформенный шлюз мессенджеров для DeepSeek Harness: подключение агента к Telegram, Feishu (Lark) и WeCom с поддержкой голосовых сообщений (авто-STT), фото и документов.

### Возможности

- **Платформы**: Telegram-бот, Feishu/Lark и Корпоративный WeChat (WeCom).
- **Голосовые заметки**: автоматическое распознавание речи (STT) голосовых сообщений в текст.
- **Медиафайлы**: пересылка изображений, документов и файлов.
- **Безопасность**: белые списки Chat ID и контроль доступа.

### Установка

```bash
dsh plugin --profile web add @goodandready/dsh-im-hub-media
```

</details>

---

<a name="-中文"></a>
<details>
<summary><h2>🇨🇳 中文 (完整技术文档)</h2></summary>

DeepSeek Harness 多平台 IM 消息网关：连接 Telegram、飞书 (Lark) 与企业微信，支持语音转文字、图片与文件互动。

### 核心亮点

- **全平台支持**：支持 Telegram Bot、飞书应用及企业微信应用。
- **语音消息自动转写**：收到语音便签自动调用 STT 转换为文本提交给智能体。
- **富媒体处理**：无缝接收与转发图片、文档和附件。
- **权限安全控制**：严格的 Chat ID 白名单机制。

### 安装方法

```bash
dsh plugin --profile web add @goodandready/dsh-im-hub-media
```

</details>
