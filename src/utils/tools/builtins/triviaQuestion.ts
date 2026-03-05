import axios from 'axios';

import type {RegisteredTool} from '../types';

const CATEGORY_MAP: Record<string, number> = {
  general: 9,
  science: 17,
  history: 23,
  geography: 22,
  sports: 21,
  music: 12,
  film: 11,
  technology: 18,
};

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

export const triviaQuestionTool: RegisteredTool = {
  definition: {
    type: 'function',
    function: {
      name: 'trivia_question',
      description:
        'Get a random trivia question with multiple choice answers. Optionally specify category and difficulty.',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description:
              'Category: general, science, history, geography, sports, music, film, or technology.',
          },
          difficulty: {
            type: 'string',
            description: '"easy", "medium", or "hard".',
          },
        },
        required: [],
      },
    },
  },
  handler: async (args: Record<string, unknown>): Promise<string> => {
    const rawCategory = args.category
      ? String(args.category).toLowerCase()
      : undefined;
    const rawDifficulty = args.difficulty
      ? String(args.difficulty).toLowerCase()
      : undefined;

    const catId = rawCategory ? CATEGORY_MAP[rawCategory] : undefined;
    const difficulty =
      rawDifficulty && ['easy', 'medium', 'hard'].includes(rawDifficulty)
        ? rawDifficulty
        : undefined;

    const params: Record<string, string | number> = {
      amount: 1,
      type: 'multiple',
    };
    if (catId !== undefined) {
      params.category = catId;
    }
    if (difficulty) {
      params.difficulty = difficulty;
    }

    try {
      const res = await axios.get('https://opentdb.com/api.php', {
        params,
        timeout: 8000,
      });

      if (res.data?.response_code !== 0) {
        return JSON.stringify({
          error: 'No trivia questions available for those filters.',
        });
      }

      const q = res.data.results[0];
      const question = decodeHtmlEntities(q.question);
      const correctAnswer = decodeHtmlEntities(q.correct_answer);
      const incorrectAnswers: string[] = (q.incorrect_answers as string[]).map(
        decodeHtmlEntities,
      );

      const choices = [...incorrectAnswers, correctAnswer].sort(
        () => Math.random() - 0.5,
      );

      return JSON.stringify({
        question,
        category: q.category,
        difficulty: q.difficulty,
        choices,
        correct_answer: correctAnswer,
      });
    } catch (error) {
      const msg =
        axios.isAxiosError(error) && error.response
          ? `Request failed: ${error.response.status}`
          : 'Request failed. Check internet connection.';
      return JSON.stringify({error: msg});
    }
  },
};
