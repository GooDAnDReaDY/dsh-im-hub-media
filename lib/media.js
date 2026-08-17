// Media helpers for the Telegram adapter: document classification (Hermes
// allowlist semantics) and outbound `MEDIA:<path>` marker extraction.
import { mkdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';

/** Public Bot API caps getFile downloads at 20 MB. */
export const TELEGRAM_MAX_DOC_BYTES = 20 * 1024 * 1024;

/** Whitelist of supported non-image/non-video documents (mirrors Hermes). */
export const SUPPORTED_DOCUMENT_TYPES = {
  '.pdf': 'application/pdf',
  '.md': 'text/markdown',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  '.log': 'text/plain',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.yaml': 'application/yaml',
  '.yml': 'application/yaml',
  '.toml': 'application/toml',
  '.ini': 'text/plain',
  '.cfg': 'text/plain',
  '.zip': 'application/zip',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.ts': 'text/plain',
  '.py': 'text/plain',
  '.sh': 'text/plain',
};

export const IMAGE_EXT_TO_MIME = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

const IMAGE_MIME_TO_EXT = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

export const VIDEO_EXT_TO_MIME = {
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
  '.mkv': 'video/x-matroska',
  '.avi': 'video/x-msvideo',
};

/** Extension from filename, falling back to MIME reverse-lookup. */
export function extOf(name, mime) {
  let ext = '';
  if (name) ext = extname(name).toLowerCase();
  const m = (mime ?? '').toLowerCase();
  if (!ext && m) ext = IMAGE_MIME_TO_EXT[m] ?? '';
  if (!ext && m) {
    const videoRev = Object.fromEntries(Object.entries(VIDEO_EXT_TO_MIME).map(([k, v]) => [v, k]));
    ext = videoRev[m] ?? '';
  }
  if (!ext && m) {
    const docRev = Object.fromEntries(Object.entries(SUPPORTED_DOCUMENT_TYPES).map(([k, v]) => [v, k]));
    ext = docRev[m] ?? '';
  }
  return ext;
}

/** Classify a downloaded document payload. */
export function classifyDocument(ext, mime) {
  const m = (mime ?? '').toLowerCase();
  if (IMAGE_EXT_TO_MIME[ext] || m.startsWith('image/')) return 'image';
  if (VIDEO_EXT_TO_MIME[ext] || Object.values(VIDEO_EXT_TO_MIME).includes(m)) return 'video';
  if (SUPPORTED_DOCUMENT_TYPES[ext]) return 'doc';
  return 'unsupported';
}

/** Outbound media kind from a local file path. */
export function mediaKindOf(path) {
  const ext = extname(path).toLowerCase();
  if (IMAGE_EXT_TO_MIME[ext]) return 'photo';
  if (ext === '.ogg' || ext === '.opus' || ext === '.oga') return 'voice';
  if (ext === '.mp3' || ext === '.m4a' || ext === '.wav' || ext === '.flac') return 'audio';
  return 'document';
}

/** Parse `MEDIA:/abs/path` lines out of reply text; returns paths + cleaned text. */
const MEDIA_RE = /^\s*MEDIA:\s*(\S+)\s*$/gm;
export function extractMediaMarkers(text) {
  const paths = [];
  const rest = text.replace(MEDIA_RE, (_, p) => {
    paths.push(p);
    return '';
  });
  return { paths, rest: rest.replace(/\n{3,}/g, '\n\n').trim() };
}

/** Keep only safe filename characters (Telegram rejects some). */
export function safeName(name) {
  return name.replace(/[^\w.\- ]/g, '_').slice(0, 120) || 'file';
}

/** Write bytes into cacheDir under a unique name; returns the absolute path. */
export function saveToCache(cacheDir, name, bytes) {
  mkdirSync(cacheDir, { recursive: true });
  const path = join(cacheDir, name);
  writeFileSync(path, bytes);
  return path;
}

export function cacheName(prefix, ext, name) {
  const base = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const extClean = ext || '';
  const display = name ? safeName(name) : '';
  return display ? `${base}-${display}${extClean}` : `${base}${extClean}`;
}

export { basename, dirname };
