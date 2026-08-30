# 📦 @goodandready/dsh-im-hub-media

<div align="center">

<h3>Многоплатформенный IM-шлюз с поддержкой голосовых сообщений (авто-STT) и медиафайлов</h3>

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

## ⚡ Обзор

**`dsh-im-hub-media`** подключает агентов DeepSeek Harness к **Telegram**, **Feishu (Lark)** и **Enterprise WeChat (WeCom)** с автоматическим распознаванием голосовых сообщений (STT) и пересылкой медиафайлов.

```mermaid
graph LR
    User[👤 Telegram / Feishu / WeCom] -->|Голосовое / Фото / Файл| Gateway[Шлюз dsh-im-hub-media]
    Gateway -->|Авто-распознавание STT| DSH[Работа агента DSH]
    DSH -->|Текстовый или медиа ответ| Gateway
    Gateway -->|Доставка сообщения| User
```

---

## 📦 Быстрая установка

```bash
dsh plugin --profile web add @goodandready/dsh-im-hub-media
```

---

## 📄 Лицензия

MIT © [GooDAnDReaDY](https://github.com/GooDAnDReaDY)
