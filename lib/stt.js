// Speech-to-text: Deepgram primary, HuggingFace Whisper fallback.
// Same providers as Hermes uses for voice messages.

/**
 * Transcribe audio bytes to text.
 * @param opts - { bytes: Uint8Array, deepgramApiKey, deepgramModel, language,
 *                hfApiKey, hfModel, logger }.
 * @returns the transcript, or '' when nothing could be transcribed.
 */
export async function transcribeAudio(opts) {
  const {
    bytes,
    deepgramApiKey,
    deepgramModel = 'nova-2',
    language = 'ru',
    hfApiKey,
    hfModel = 'openai/whisper-large-v3',
    logger,
  } = opts;

  if (deepgramApiKey) {
    try {
      const response = await fetch('https://api.deepgram.com/v1/listen', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${deepgramApiKey}`,
          'Content-Type': 'application/octet-stream',
        },
        body: bytes,
      });
      if (response.ok) {
        const data = await response.json();
        const transcript = data?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? '';
        if (typeof transcript === 'string' && transcript.trim()) return transcript.trim();
        logger?.warn?.('dsh-im-hub-media: deepgram returned empty transcript');
      } else {
        logger?.warn?.(`dsh-im-hub-media: deepgram HTTP ${response.status}`);
      }
    } catch (error) {
      logger?.warn?.(`dsh-im-hub-media: deepgram error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (hfApiKey) {
    try {
      const response = await fetch(`https://api-inference.huggingface.co/models/${hfModel}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfApiKey}`,
          'Content-Type': 'application/octet-stream',
        },
        body: bytes,
      });
      if (response.ok) {
        const text = await response.text();
        try {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            const joined = parsed.map((item) => (item && typeof item === 'object' ? (item.text ?? item.generated_text ?? '') : String(item))).filter(Boolean).join(' ');
            if (joined.trim()) return joined.trim();
          } else if (parsed && typeof parsed === 'object') {
            const direct = parsed.text ?? parsed.generated_text;
            if (typeof direct === 'string' && direct.trim()) return direct.trim();
          }
        } catch {
          if (text.trim()) return text.trim();
        }
        logger?.warn?.('dsh-im-hub-media: hf whisper returned empty result');
      } else {
        logger?.warn?.(`dsh-im-hub-media: hf whisper HTTP ${response.status} (model may still be loading)`);
      }
    } catch (error) {
      logger?.warn?.(`dsh-im-hub-media: hf whisper error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return '';
}
