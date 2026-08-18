# dsh-im-hub-media

**Telegram-first fork** of [`dsh-im-hub`](https://github.com/ThreeBody6666/dsh-im-hub) for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (dsh) that adds **media support** to the multi-platform IM gateway. Talk to your dsh agent from **Telegram** (voice, photos, documents, video, replies), with **Feishu/Lark** and **WeCom** kept from the original.

> One agent per chat. Multi-turn context. Whitelist access control. Idle reaping. All the `dsh-im-hub` adapters, plus a media pipeline on Telegram.

## What's added vs. `dsh-im-hub`

| Area | Feature |
|---|---|
| **Media** | Incoming **photos / voice / documents / video** are downloaded to a local cache; supported docs are injected inline or kept for the agent. |
| **Voice → text (STT)** | Voice messages transcribed automatically: **Deepgram** primary (`api.deepgram.com`), **HuggingFace Whisper** (`openai/whisper-large-v3`) fallback. |
| **On-device vision** | Photos without a caption are routed to a vision model (see `dsh-vision-bridge`) instead of failing a text-only turn. |
| **Outbound media** | Agents can emit `MEDIA:<path>` markers and the bot sends the file back into the chat. |
| **Reply handling** | Telegram `reply_to_message` is passed through so the agent can answer in-context. |

Supported inbound document types follow the Hermes allowlist: PDF, Markdown, plain text, CSV, logs, JSON/XML/YAML/TOML/INI/CFG, archives, and Office (doc/xls/ppt + x). Upper 20 MB bound (public Bot API cap).

## Install

```bash
# From npm after publishing:
dsh plugin --profile web add @goodandready/dsh-im-hub-media

# From GitHub:
dsh plugin --profile web add github:GooDAnDReaDY/dsh-im-hub-media

# Locally from a checkout:
dsh plugin --profile web add /path/to/dsh-im-hub-media
```

Restart the Web UI afterwards.

The plugin row is **disabled by default** — enable it and add your credentials in the profile's `cordis.patch.yml`:

```yaml
- id: dsh-im-hub-media
  disabled: false
  config:
    adapters:
      telegram:
        enabled: true
        token: '123456:ABC-DEF...'      # from @BotFather
        allowedUserIds: []              # empty = everyone (set in production)
    media:
      stt:
        deepgramApiKey: ''              # optional STT; needs a Deepgram key
        # hfApiKey: ''                  # optional HuggingFace Whisper fallback
```

## Configure

### Web GUI (recommended)

A settings card appears at **Settings → Plugins → Configurable plugins → IM Gateway**. It edits the same configuration live — no restart needed (the bridge hot-reloads on save). Credential fields are stored server-side and shown as write-only "configured / not set" badges.

### Adapters (kept from `dsh-im-hub`)

| Adapter | Default | Description |
|---|---|---|
| `adapters.telegram.enabled` | `false` | Telegram Bot API long polling; `token` from [@BotFather](https://t.me/BotFather). |
| `adapters.telegram.allowedUserIds` | `[]` | Numeric Telegram user ids; empty = everyone. |
| `adapters.feishu.enabled` / `appId` / `appSecret` | `false`/`''` | Feishu adapter (`mode: websocket` by default, no public URL; `webhook` = HTTP callback). |
| `adapters.lark.*` | — | International Lark edition (`open.larksuite.com`), same shape as Feishu. |
| `adapters.wecom.*` | — | WeCom app-message callback (`corpId`/`corpSecret`/`agentId` + `token`/`encodingAesKey`). |
| `adapters.mock.enabled` / `port` | `false`/`0` | Test-only adapter (stdin + local HTTP; `0` = ephemeral port). |

See `dsh-im-hub` upstream README for the full adapter reference.

### `media` schema (new in this fork)

| Field | Default | Description |
|---|---|---|
| `media.stt.deepgramApiKey` | `''` (secret) | Deepgram API key for voice→text. Empty = skip Deepgram. |
| `media.stt.deepgramModel` | `nova-2` | Deepgram model. |
| `media.stt.language` | `ru` | STT language hint (BCP-47). |
| `media.stt.hfApiKey` | `''` (secret) | HuggingFace token for the Whisper fallback. Empty = skip. |
| `media.stt.hfModel` | `openai/whisper-large-v3` | HuggingFace Whisper model id. |
| `media.maxDocBytes` | `20 * 1024 * 1024` | Max inbound document bytes. |
| `media.maxTextInjectBytes` | `100 * 1024` | Max text-file bytes injected inline into the agent message. |
| `media.cacheDir` | `~/.dsh/im-hub-media/cache` | Local cache dir for downloaded media (defaults to the user home). |

### Example `settings.yaml`

```yaml
dsh-im-hub-media:
  adapters:
    telegram:
      enabled: true
      token: '<bot token>'
  media:
    stt:
      deepgramApiKey: '<deepgram key>'
      language: ru
```

## Usage

From Telegram, just message your bot:

- **Voice** → transcribed by Deepgram/Whisper and sent to the agent as text.
- **Photo/Videos** → downloaded; handled via vision if there's no caption.
- **Document / short text files** → split inline or kept for the agent (respecting `maxTextInjectBytes`).
- **`/help`, `/reset`, `/status`, `/model`** → Slack-style commands.

The agent can send media back by emitting a `MEDIA:<absolute path>` marker in its message.

## Commands

| Command | Effect |
|---|---|
| `/help` | Show command help. |
| `/reset` | Clear this chat's conversation context (fresh agent). |
| `/status` | Show active chats / agents / adapters. |
| `/model` | Show the current model selection. |

## Structure

```
dsh-im-hub-media/
├── package.json            # dsh bundle/plugin metadata + peerDependencies
├── cordis.patch.yml        # bundle layer: plugin row (disabled by default)
├── lib/index.js            # host: settings schema + Bridge wiring (media cache)
├── lib/bridge.js           # per-chat agent lifecycle
├── lib/media.js            # document classification + outbound MEDIA markers
├── lib/stt.js              # Deepgram + HuggingFace Whisper transcription
├── lib/client.js           # browser: settings card in the Web GUI
├── lib/adapters/*          # telegram / feishu(+lark) / wecom / mock
├── README.md
└── LICENSE                 # MIT
```

## Security notes

- **Force a whitelist.** Set `allowedUserIds` on every enabled adapter before exposing the bot publicly. An empty list means *anyone* can drive your agent — which can execute tools on the host.
- IM messages are injected into the agent session as plugin-originated user messages; they do **not** bypass the deployment's own approval/guardrail policy — treat them like any other user input.
- Platform secrets (`token`, `appSecret`, `encodingAesKey`, STT keys) live in the profile's `cordis.patch.yml` / `settings.yaml`; **keep that file private**.
- Media downloaded into `cacheDir` stays local; nothing is sent elsewhere except the agent conversation.

## License

MIT

## Credits

Fork of [`dsh-im-hub`](https://github.com/ThreeBody6666/dsh-im-hub) (MIT). All `dsh-im-hub` adapter logic and credit belong to the original author; this fork adds the Telegram media/STT/vision pipeline.
