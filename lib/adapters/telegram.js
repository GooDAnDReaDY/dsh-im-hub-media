// Telegram adapter — long-polling mode (no public endpoint needed).
//
// Fork of the dsh-im-hub telegram adapter with media support:
//   * voice/audio/photo/video/document messages are downloaded to a local
//     cache and forwarded to the bridge as `attachments`;
//   * documents follow the Hermes allowlist: image/video documents are
//     rerouted to their native kind, text files (.md/.txt) up to
//     maxTextInjectBytes are injected inline into the message text, unknown
//     types and oversized files get a polite refusal text;
//   * the replied-to message text is passed as `replyText`;
//   * outbound `MEDIA:/abs/path` markers become native
//     sendPhoto/sendVoice/sendAudio/sendDocument calls and are removed from
//     the text.
//
// Protocol: Bot API getUpdates long polling. Create a bot with @BotFather,
// then put the token in the profile patch:
//
//   - id: dsh-im-hub-media
//     disabled: false
//     config:
//       adapters:
//         telegram:
//           enabled: true
//           token: '123456:ABC-DEF...'
//
// Docs: https://core.telegram.org/bots/api

import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import {
  classifyDocument,
  extractMediaMarkers,
  extOf,
  IMAGE_EXT_TO_MIME,
  mediaKindOf,
  safeName,
  saveToCache,
  cacheName,
  SUPPORTED_DOCUMENT_TYPES,
  VIDEO_EXT_TO_MIME,
} from '../media.js';

const API = 'https://api.telegram.org';

/** Hard Bot API limit per text message. */
const TELEGRAM_MAX = 4096;

function splitTelegramText(text) {
  if (text.length <= TELEGRAM_MAX) return [text];
  const parts = [];
  let rest = text;
  while (rest.length > TELEGRAM_MAX) {
    let cut = rest.lastIndexOf('\n', TELEGRAM_MAX);
    if (cut < TELEGRAM_MAX / 2) cut = rest.lastIndexOf(' ', TELEGRAM_MAX);
    if (cut < TELEGRAM_MAX / 2) cut = TELEGRAM_MAX;
    parts.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trimStart();
  }
  if (rest) parts.push(rest);
  return parts;
}

/**
 * @param options - { token, allowedUserIds, timeoutSeconds, pollIntervalMs,
 *   onMessage, logger, media } where media = { maxDocBytes,
 *   maxTextInjectBytes, cacheDir }.
 */
export function createTelegramAdapter(options) {
  const {
    token,
    allowedUserIds = [],
    timeoutSeconds = 50,
    pollIntervalMs = 500,
    onMessage,
    logger,
    media = {},
  } = options;
  const maxDocBytes = media.maxDocBytes ?? 20 * 1024 * 1024;
  const maxTextInjectBytes = media.maxTextInjectBytes ?? 100 * 1024;
  const cacheDir = media.cacheDir ?? '/home/vadim/.dsh/im-hub-media/cache';

  let offset = 0;
  let stopped = false;
  let pollTimer;
  let started = false;

  async function call(method, params = {}) {
    const res = await fetch(`${API}/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`telegram ${method}: HTTP ${res.status} ${body.slice(0, 200)}`);
    }
    const json = await res.json();
    if (!json.ok) {
      throw new Error(`telegram ${method}: ${json.description ?? 'unknown error'} (${json.error_code ?? '?'})`);
    }
    return json.result;
  }

  /** Multipart POST (file uploads). */
  async function callMultipart(method, form) {
    const res = await fetch(`${API}/bot${token}/${method}`, { method: 'POST', body: form });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`telegram ${method}: HTTP ${res.status} ${body.slice(0, 200)}`);
    }
    const json = await res.json();
    if (!json.ok) {
      throw new Error(`telegram ${method}: ${json.description ?? 'unknown error'} (${json.error_code ?? '?'})`);
    }
    return json.result;
  }

  async function getFile(fileId) {
    return call('getFile', { file_id: fileId });
  }

  async function downloadFile(filePath) {
    const res = await fetch(`${API}/file/bot${token}/${filePath}`);
    if (!res.ok) throw new Error(`telegram file download: HTTP ${res.status}`);
    return new Uint8Array(await res.arrayBuffer());
  }

  /** Send one native media attachment from a local path. */
  async function sendMedia(chatId, kind, path, caption) {
    let bytes;
    try {
      bytes = await readFile(path);
    } catch (error) {
      logger?.warn?.(`dsh-im-hub-media: cannot read media ${path}: ${error instanceof Error ? error.message : String(error)}`);
      return;
    }
    const form = new FormData();
    form.append('chat_id', String(chatId));
    if (caption) form.append('caption', caption.slice(0, 1024));
    const name = basename(path);
    const blob = new Blob([bytes]);
    let method;
    if (kind === 'photo') {
      method = 'sendPhoto';
      form.append('photo', blob, name);
    } else if (kind === 'voice') {
      method = 'sendVoice';
      form.append('voice', blob, name);
    } else if (kind === 'audio') {
      method = 'sendAudio';
      form.append('audio', blob, name);
    } else {
      method = 'sendDocument';
      form.append('document', blob, name);
    }
    await callMultipart(method, form);
  }

  /** Send reply text; `MEDIA:/abs/path` lines become native attachments. */
  async function send(chatId, text) {
    const { paths, rest } = extractMediaMarkers(text);
    for (const path of paths) {
      const kind = mediaKindOf(path);
      try {
        await sendMedia(chatId, kind, path, '');
      } catch (error) {
        logger?.warn?.(`dsh-im-hub-media: ${kind} send failed for ${path}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    if (rest) {
      for (const chunk of splitTelegramText(rest)) {
        await call('sendMessage', { chat_id: Number(chatId), text: chunk });
      }
    }
  }

  async function poll() {
    if (stopped) return;
    try {
      const updates = await call('getUpdates', {
        timeout: timeoutSeconds,
        offset,
        allowed_updates: ['message']
      });
      for (const update of updates ?? []) {
        offset = Math.max(offset, update.update_id + 1);
        const msg = update.message;
        if (msg === undefined) continue;
        const chatId = String(msg.chat.id);
        const userId = msg.from?.id;
        if (allowedUserIds.length > 0 && !allowedUserIds.includes(Number(userId))) continue;

        let text = msg.text ?? msg.caption ?? '';
        const attachments = [];
        const replyText = msg.reply_to_message
          ? (msg.reply_to_message.text ?? msg.reply_to_message.caption ?? '')
          : '';

        try {
          // ── photo (largest size) ───────────────────────────────────────
          if (msg.photo?.length > 0) {
            const largest = msg.photo[msg.photo.length - 1];
            const file = await getFile(largest.file_id);
            const bytes = await downloadFile(file.file_path);
            const ext = extOf(file.file_path, '') || '.jpg';
            const path = saveToCache(cacheDir, cacheName('photo', ext, ''), bytes);
            attachments.push({ kind: 'photo', path, mime: IMAGE_EXT_TO_MIME[ext] ?? 'image/jpeg' });
          }

          // ── voice (round bubble) ───────────────────────────────────────
          if (msg.voice) {
            const file = await getFile(msg.voice.file_id);
            const bytes = await downloadFile(file.file_path);
            const path = saveToCache(cacheDir, cacheName('voice', '.ogg', ''), bytes);
            attachments.push({ kind: 'voice', path, mime: 'audio/ogg' });
          }

          // ── audio file ─────────────────────────────────────────────────
          if (msg.audio) {
            const file = await getFile(msg.audio.file_id);
            const bytes = await downloadFile(file.file_path);
            const ext = extOf(file.file_path, msg.audio.mime_type) || '.mp3';
            const path = saveToCache(cacheDir, cacheName('audio', ext, ''), bytes);
            attachments.push({ kind: 'audio', path, mime: msg.audio.mime_type ?? 'audio/mpeg' });
          }

          // ── video ──────────────────────────────────────────────────────
          if (msg.video) {
            const file = await getFile(msg.video.file_id);
            const bytes = await downloadFile(file.file_path);
            const ext = extOf(file.file_path, msg.video.mime_type) || '.mp4';
            const path = saveToCache(cacheDir, cacheName('video', ext, ''), bytes);
            attachments.push({ kind: 'video', path, mime: msg.video.mime_type ?? VIDEO_EXT_TO_MIME[ext] ?? 'video/mp4' });
          }

          // ── document (Hermes allowlist semantics) ───────────────────────
          if (msg.document) {
            const doc = msg.document;
            const ext = extOf(doc.file_name, doc.mime_type);
            const mime = (doc.mime_type ?? '').toLowerCase();
            const displayName = doc.file_name ?? `document${ext || ''}`;

            if (doc.file_size && doc.file_size > maxDocBytes) {
              const limitMb = Math.round(maxDocBytes / (1024 * 1024));
              text = text
                ? `${text}\n\nДокумент «${displayName}» слишком большой (лимит ${limitMb} МБ).`
                : `Документ «${displayName}» слишком большой (лимит ${limitMb} МБ).`;
            } else {
              const file = await getFile(doc.file_id);
              const bytes = await downloadFile(file.file_path);
              const kind = classifyDocument(ext, mime);
              const name = safeName(displayName);

              if (kind === 'image') {
                const imageExt = IMAGE_EXT_TO_MIME[ext] ? ext : (Object.entries(IMAGE_EXT_TO_MIME).find(([, m]) => m === mime)?.[0] ?? '.jpg');
                const path = saveToCache(cacheDir, cacheName('docimg', imageExt, name), bytes);
                attachments.push({
                  kind: 'photo',
                  path,
                  mime: mime.startsWith('image/') ? mime : (IMAGE_EXT_TO_MIME[imageExt] ?? 'image/jpeg'),
                  name,
                });
              } else if (kind === 'video') {
                const path = saveToCache(cacheDir, cacheName('docvid', ext, name), bytes);
                attachments.push({
                  kind: 'video',
                  path,
                  mime: VIDEO_EXT_TO_MIME[ext] ?? mime ?? 'video/mp4',
                  name,
                });
              } else if (kind === 'doc') {
                const path = saveToCache(cacheDir, cacheName('doc', ext, name), bytes);
                attachments.push({
                  kind: 'document',
                  path,
                  mime: SUPPORTED_DOCUMENT_TYPES[ext] ?? mime,
                  name,
                });
                if ((ext === '.md' || ext === '.txt') && bytes.length <= maxTextInjectBytes) {
                  try {
                    const content = new TextDecoder('utf-8').decode(bytes);
                    const injection = `[Содержимое ${name}]:\n${content}`;
                    text = text ? `${injection}\n\n${text}` : injection;
                  } catch {
                    /* not UTF-8; path-only delivery */
                  }
                }
              } else {
                const supported = Object.keys(SUPPORTED_DOCUMENT_TYPES).join(', ');
                text = `Неподдерживаемый тип документа «${ext || 'unknown'}». Поддерживаются: ${supported}`;
              }
            }
          }
        } catch (error) {
          logger?.warn?.(`dsh-im-hub-media: media download failed: ${error instanceof Error ? error.message : String(error)}`);
        }

        const reply = (replyTextValue) => send(chatId, replyTextValue);
        try {
          await onMessage({
            platform: 'telegram',
            chatId,
            userId: String(userId ?? ''),
            text,
            messageId: String(msg.message_id ?? ''),
            reply,
            replyText,
            attachments,
          });
        } catch (error) {
          logger?.warn?.(`dsh-im-hub-media: telegram message handling failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    } catch (error) {
      logger?.warn?.(`dsh-im-hub-media: telegram poll failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      pollTimer = setTimeout(poll, pollIntervalMs);
    }
  }

  return {
    name: 'telegram',
    async start() {
      if (started) return;
      started = true;
      // Verify the token eagerly so misconfiguration surfaces at boot.
      const me = await call('getMe');
      logger?.info?.(`dsh-im-hub-media: telegram bot @${me.username ?? me.id} connected`);
      poll();
    },
    stop() {
      stopped = true;
      if (pollTimer !== undefined) clearTimeout(pollTimer);
    }
  };
}
