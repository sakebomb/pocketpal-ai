import axios from 'axios';

import type {RegisteredTool} from '../types';

export const sportsScoresTool: RegisteredTool = {
  definition: {
    type: 'function',
    function: {
      name: 'sports_scores',
      description:
        'Get recent match results for a sports team. Search by team name.',
      parameters: {
        type: 'object',
        properties: {
          team: {
            type: 'string',
            description: 'Team name to search for.',
          },
          sport: {
            type: 'string',
            description: 'Sport type hint (e.g. "soccer", "basketball").',
          },
        },
        required: ['team'],
      },
    },
  },
  handler: async (args: Record<string, unknown>): Promise<string> => {
    const team = String(args.team ?? '').trim();

    try {
      const searchRes = await axios.get(
        'https://www.thesportsdb.com/api/v1/json/3/searchteams.php',
        {params: {t: team}, timeout: 8000},
      );

      const teams: Array<{
        idTeam: string;
        strTeam: string;
        strSport: string;
        strLeague: string;
      }> = searchRes.data?.teams ?? [];

      if (teams.length === 0) {
        return JSON.stringify({error: `Team not found: ${team}`});
      }

      const {idTeam, strTeam, strSport, strLeague} = teams[0];

      const eventsRes = await axios.get(
        'https://www.thesportsdb.com/api/v1/json/3/eventslast.php',
        {params: {id: idTeam}, timeout: 8000},
      );

      const rawEvents: Array<{
        dateEvent: string;
        strHomeTeam: string;
        strAwayTeam: string;
        strResult: string | null;
        intHomeScore: string | null;
        intAwayScore: string | null;
        strLeague: string;
      }> = eventsRes.data?.results ?? [];

      const recentResults = rawEvents.slice(0, 5).map(e => ({
        date: e.dateEvent,
        home: e.strHomeTeam,
        away: e.strAwayTeam,
        score: e.strResult ?? `${e.intHomeScore}-${e.intAwayScore}`,
        competition: e.strLeague,
      }));

      return JSON.stringify({
        team: strTeam,
        sport: strSport,
        league: strLeague,
        recent_results: recentResults,
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
