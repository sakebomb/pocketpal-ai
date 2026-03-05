import axios from 'axios';

import {apiKeyStore} from '../../../store/ApiKeyStore';
import type {RegisteredTool} from '../types';

export const movieSearchTool: RegisteredTool = {
  definition: {
    type: 'function',
    function: {
      name: 'movie_search',
      description:
        'Look up movies or TV shows by title. Returns plot, ratings, cast, and more. Requires OMDB API key.',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Movie or TV show title to look up.',
          },
          year: {
            type: 'string',
            description: 'Release year (optional, narrows results).',
          },
          type: {
            type: 'string',
            description: '"movie", "series", or "episode".',
          },
        },
        required: ['title'],
      },
    },
  },
  handler: async (args: Record<string, unknown>): Promise<string> => {
    const apiKey = apiKeyStore.omdbApiKey;
    if (!apiKey) {
      return JSON.stringify({
        error:
          'OMDB API key not configured. Add it in Settings → API Keys.',
      });
    }

    const title = String(args.title ?? '').trim();
    const year = args.year ? String(args.year).trim() : undefined;
    const type = args.type ? String(args.type).trim() : undefined;

    try {
      const params: Record<string, string> = {
        t: title,
        apikey: apiKey,
        plot: 'full',
      };
      if (year) {
        params.y = year;
      }
      if (type) {
        params.type = type;
      }

      const res = await axios.get('https://www.omdbapi.com/', {
        params,
        timeout: 8000,
      });

      const d = res.data;
      if (d.Response === 'False') {
        return JSON.stringify({error: d.Error});
      }

      const rtRating = (
        d.Ratings as Array<{Source: string; Value: string}> | undefined
      )?.find(r => r.Source === 'Rotten Tomatoes')?.Value;

      return JSON.stringify({
        title: d.Title,
        year: d.Year,
        type: d.Type,
        rated: d.Rated,
        runtime: d.Runtime,
        genre: d.Genre,
        director: d.Director,
        actors: d.Actors,
        plot: d.Plot,
        imdb_rating: d.imdbRating,
        rt_rating: rtRating,
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
