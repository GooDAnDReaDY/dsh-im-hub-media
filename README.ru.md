# 📦 @goodandready/dsh-im-hub-media

<div align="center">

<h3>Многоплатформенный IM-шлюз с поддержкой голосовых сообщений (авто-STT) и двусторонней отправкой медиафайлов для DeepSeek Harness</h3>

<p align="center">
  <a href="https://www.npmjs.com/package/@goodandready/dsh-im-hub-media"><img src="https://img.shields.io/npm/v/@goodandready/dsh-im-hub-media.svg?style=for-the-badge&color=6366f1&labelColor=1e1b4b" alt="npm version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-10b981.svg?style=for-the-badge&color=10b981&labelColor=064e3b" alt="license"></a>
  <a href="https://github.com/topics/dsh-plugin"><img src="https://img.shields.io/badge/DSH-Plugin-8b5cf6.svg?style=for-the-badge&labelColor=2e1065" alt="DSH Plugin"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node-20%2B-f59e0b.svg?style=for-the-badge&labelColor=451a03" alt="Node version"></a>
</p>

<p align="center">
  <a href="https://goodandready.app/"><img src="https://img.shields.io/badge/Все_проекты_автора-goodandready.app-ff4500.svg?style=for-the-badge&logo=rocket&logoColor=white&labelColor=1a1a2e" alt="Все проекты автора"></a>
</p>

<p align="center">
  <a href="README.md"><b>🇬🇧 English</b></a> •
  <a href="README.ru.md"><b>🇷🇺 Русский</b></a> •
  <a href="README.zh.md"><b>🇨🇳 中文说明</b></a>
</p>

</div>

---

## ⚡ Обзор

**`dsh-im-hub-media`** превращает ваших агентов **DeepSeek Harness** в круглосуточных ассистентов в мессенджерах **Telegram**, **Feishu (Lark)** и **Enterprise WeChat (WeCom)** с автоматическим распознаванием голосовых сообщений и полноценным двусторонним обменом медиафайлами.

В отличие от простых текстовых ботов, плагин обрабатывает голосовые сообщения, фотографии, документы и цепочки ответов (Replies), позволяя агенту отвечать нативными медиа-вложениями, синтезированным голосом и файлами.

```mermaid
graph LR
    subgraph Users [Мессенджеры и чаты]
        TG[Telegram Чат / Канал] --> Gateway[Шлюз IM Hub Media]
        Lark[Feishu / Lark WebSocket] --> Gateway
        WeCom[Enterprise WeChat Бот] --> Gateway
    end

    subgraph Inbound [Входящий конвейер медиа]
        Gateway --> MediaRouter{Маршрутизатор типов}
        MediaRouter -->|Голосовые .oga/.ogg/.amr| STT[Авто-распознавание речи STT]
        MediaRouter -->|Фото / Скриншоты| Vision[Передача в Vision-контекст]
        MediaRouter -->|Документы / Файлы| Doc[Парсер документов и инлайн-текст]
        MediaRouter -->|Текст и цитирование| Ctx[Сборка контекста диалога]
    end

    subgraph DSHCore [Ядро агента DSH]
        STT --> Agent[Цикл выполнения агента]
        Vision --> Agent
        Doc --> Agent
        Ctx --> Agent
    end

    subgraph Outbound [Исходящая отправка]
        Agent -->|Маркеры MEDIA:/path| OutRouter{Диспетчер нативных медиа}
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

## ✨ Возможности платформ и работа с медиа

### 1. Адаптер Telegram
* 🎙️ **Распознавание входящих голосовых (STT)**: голосовые заметки (`.oga`/`.ogg`) автоматически перехватываются, транскрибируются через STT-цепочку (например, `dsh-voice`) и передаются агенту в виде текста.
* 🖼️ **Входящие фото и скриншоты**: изображения передаются моделям зрения или обрабатываются через `dsh-vision-bridge`.
* 📄 **Обработка документов**: фильтрация по белому списку расширений в стиле Hermes, лимиты на размер и инъекция содержимого текстовых/кодовых файлов.
* 💬 **Цитирование и цепочки ответов**: ответ на предыдущее сообщение автоматически подтягивает исходный контекст.
* 📤 **Нативная отправка медиа**: агент может указать маркер `MEDIA:/абсолютный/путь` в ответе — плагин вырежет маркер и отправит нативное фото, голосовое или документ пользователю.

### 2. Адаптер Feishu (Lark)
* ⚡ **WebSocket и Webhook шлюз**: постоянное соединение через WebSocket (`feishu-ws-frame`) или webhook-события.
* 📇 **Интерактивные карточки**: рендеринг форматированного Markdown, интерактивных кнопок и форм.
* 📁 **Голосовые и файлы**: прием и отправка аудио (`opus`/`amr`), картинок и вложений.

### 3. Адаптер Enterprise WeChat (WeCom)
* 🔒 **Корпоративная безопасность**: встроенное шифрование/дешифрование XML/JSON сообщений.
* 👥 **Боты и приложения**: поддержка групповых ботов и внутренних корпоративных приложений.

---

## 🔒 Безопасность и контроль доступа

* **Белые списки пользователей и чатов**: фильтрация доступа через `allowedUsers` и `allowedChats`.
* **Изоляция сессий**: каждый чат работает в отдельном изолированном контексте.
* **Безопасные секреты**: токены ботов читаются из хранилища Credentials хоста.

---

## 📦 Быстрая установка

```bash
dsh plugin --profile web add @goodandready/dsh-im-hub-media
```

---

## ⚙️ Пример конфигурации (`settings.yaml`)

```yaml
dsh-im-hub-media:
  adapters:
    telegram:
      enabled: true
      tokenEnv: TELEGRAM_BOT_TOKEN
      allowedUsers: ["123456789"]
      sttProvider: auto
      downloadMediaDir: data/im/media
    feishu:
      enabled: false
      appId: cli_xxx
      appSecretEnv: FEISHU_APP_SECRET
    wecom:
      enabled: false
      corpId: ww_xxx
      secretEnv: WECOM_SECRET
```

---

## 📄 Лицензия

MIT © [GooDAnDReaDY](https://github.com/GooDAnDReaDY)
