import axios from 'axios';

import {apiKeyStore} from '../../../store/ApiKeyStore';
import type {RegisteredTool} from '../types';

export const flightTrackerTool: RegisteredTool = {
  definition: {
    type: 'function',
    function: {
      name: 'flight_status',
      description:
        'Get real-time flight status by flight number. Requires AviationStack API key.',
      parameters: {
        type: 'object',
        properties: {
          flight_number: {
            type: 'string',
            description: 'IATA flight number (e.g. "UA123", "DL456").',
          },
        },
        required: ['flight_number'],
      },
    },
  },
  handler: async (args: Record<string, unknown>): Promise<string> => {
    const apiKey = apiKeyStore.aviationstackApiKey;
    if (!apiKey) {
      return JSON.stringify({
        error:
          'AviationStack API key not configured. Add it in Settings → API Keys.',
      });
    }

    const flightNumber = String(args.flight_number ?? '').trim().toUpperCase();

    try {
      const res = await axios.get(
        'https://api.aviationstack.com/v1/flights',
        {
          params: {
            access_key: apiKey,
            flight_iata: flightNumber,
            limit: 1,
          },
          timeout: 10000,
        },
      );

      const flights: Array<Record<string, unknown>> = res.data?.data ?? [];
      if (flights.length === 0) {
        return JSON.stringify({error: `Flight not found: ${flightNumber}`});
      }

      const f = flights[0] as {
        flight: {iata: string};
        flight_status: string;
        departure: {
          airport: string;
          iata: string;
          scheduled: string;
          actual: string;
          delay: number | null;
        };
        arrival: {
          airport: string;
          iata: string;
          scheduled: string;
          estimated: string;
        };
        airline: {name: string};
      };

      return JSON.stringify({
        flight: f.flight.iata,
        status: f.flight_status,
        departure: {
          airport: f.departure.airport,
          iata: f.departure.iata,
          scheduled: f.departure.scheduled,
          actual: f.departure.actual,
          delay: f.departure.delay,
        },
        arrival: {
          airport: f.arrival.airport,
          iata: f.arrival.iata,
          scheduled: f.arrival.scheduled,
          estimated: f.arrival.estimated,
        },
        airline: f.airline.name,
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
