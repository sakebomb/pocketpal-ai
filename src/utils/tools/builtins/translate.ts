import axios from 'axios';

import type {RegisteredTool} from '../types';

const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';

export const translateTool: RegisteredTool = {
  definition: {
    type: 'function',
    function: {
      name: 'translate_text',
      description:
        'Translate text from one language to another. Use ISO 639-1 codes (e.g. "en", "es", "fr", "de", "zh", "ja", "ar"). Leave from_language blank to auto-detect.',
      parameters: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'The text to translate.',
          },
          to_language: {
            type: 'string',
            description: 'Target language code (e.g. "es" for Spanish, "fr" for French).',
          },
          from_language: {
            type: 'string',
            description: 'Source language code. Omit to auto-detect.',
          },
        },
        required: ['text', 'to_language'],
      },
    },
  },
  handler: async (args: Record<string, unknown>): Promise<string> => {
    const text = String(args.text ?? '').trim();
    const toLang = String(args.to_language ?? '').trim().toLowerCase();
    const fromLang = String(args.from_language ?? 'auto').trim().toLowerCase();

    if (!text) return JSON.stringify({error: 'No text provided.'});
    if (!toLang) return JSON.stringify({error: 'No target language provided.'});

    // MyMemory limit: 500 chars/request for anonymous
    const truncated = text.slice(0, 500);
    const langPair = `${fromLang === 'auto' ? '' : fromLang}|${toLang}`;

    try {
      const res = await axios.get(MYMEMORY_URL, {
        params: {q: truncated, langpair: langPair},
        timeout: 10000,
      });

      const {responseStatus, responseData, translatedText} = res.data;

      if (responseStatus !== 200) {
        return JSON.stringify({error: `Translation failed (status ${responseStatus}). Check language codes.`});
      }

      const translation = translatedText ?? responseData?.translatedText ?? '';
      const detectedLang = res.data?.matches?.[0]?.source ?? fromLang;

      return JSON.stringify({
        original: truncated,
        translation,
        from_language: detectedLang,
        to_language: toLang,
        truncated: text.length > 500,
      });
    } catch (error) {
      const msg = axios.isAxiosError(error) && error.response
        ? `Translation failed: ${error.response.status}`
        : 'Translation failed. Check internet connection.';
      return JSON.stringify({error: msg});
    }
  },
};
