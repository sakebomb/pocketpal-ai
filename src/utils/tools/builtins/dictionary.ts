import axios from 'axios';

import type {RegisteredTool} from '../types';

const DICT_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en';

export const dictionaryTool: RegisteredTool = {
  definition: {
    type: 'function',
    function: {
      name: 'dictionary_lookup',
      description:
        'Look up the definition, pronunciation, and examples for an English word.',
      parameters: {
        type: 'object',
        properties: {
          word: {
            type: 'string',
            description: 'The English word to look up.',
          },
        },
        required: ['word'],
      },
    },
  },
  handler: async (args: Record<string, unknown>): Promise<string> => {
    const word = String(args.word ?? '').trim().toLowerCase();
    if (!word) {
      return JSON.stringify({error: 'No word provided.'});
    }

    try {
      const res = await axios.get(`${DICT_URL}/${encodeURIComponent(word)}`, {
        timeout: 8000,
      });

      const entry = res.data?.[0];
      if (!entry) {
        return JSON.stringify({error: `No definition found for "${word}".`});
      }

      // Flatten to concise output
      const meanings = (entry.meanings ?? []).slice(0, 3).map((m: any) => ({
        part_of_speech: m.partOfSpeech,
        definitions: (m.definitions ?? []).slice(0, 2).map((d: any) => ({
          definition: d.definition,
          example: d.example ?? null,
        })),
        synonyms: (m.synonyms ?? []).slice(0, 5),
      }));

      const phonetic =
        entry.phonetic ??
        entry.phonetics?.find((p: any) => p.text)?.text ??
        null;

      return JSON.stringify({word: entry.word, phonetic, meanings});
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return JSON.stringify({error: `Word not found: "${word}".`});
      }
      const msg = axios.isAxiosError(error) && error.response
        ? `Dictionary lookup failed: ${error.response.status}`
        : 'Dictionary lookup failed. Check internet connection.';
      return JSON.stringify({error: msg});
    }
  },
};
