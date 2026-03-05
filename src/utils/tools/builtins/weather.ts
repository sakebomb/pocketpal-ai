import axios from 'axios';

import type {RegisteredTool} from '../types';

const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

const WMO_CODES: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Icy fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  80: 'Slight showers',
  81: 'Moderate showers',
  82: 'Violent showers',
  95: 'Thunderstorm',
  99: 'Thunderstorm with hail',
};

export const weatherTool: RegisteredTool = {
  definition: {
    type: 'function',
    function: {
      name: 'get_weather',
      description:
        'Get the current weather for a location. Use this for any weather-related questions.',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description:
              'City name, optionally with state/country (e.g. "Vienna, VA" or "London, UK").',
          },
        },
        required: ['location'],
      },
    },
  },
  handler: async (args: Record<string, unknown>): Promise<string> => {
    const location = String(args.location ?? '').trim();
    if (!location) {
      return JSON.stringify({error: 'No location provided.'});
    }

    try {
      // Step 1: geocode
      const geoRes = await axios.get(GEOCODE_URL, {
        params: {name: location, count: 1, language: 'en', format: 'json'},
        timeout: 8000,
      });
      const place = geoRes.data?.results?.[0];
      if (!place) {
        return JSON.stringify({error: `Location not found: ${location}`});
      }

      // Step 2: forecast
      const wxRes = await axios.get(FORECAST_URL, {
        params: {
          latitude: place.latitude,
          longitude: place.longitude,
          current: 'temperature_2m,apparent_temperature,weathercode,windspeed_10m,relative_humidity_2m',
          temperature_unit: 'fahrenheit',
          windspeed_unit: 'mph',
          timezone: 'auto',
        },
        timeout: 8000,
      });
      const cur = wxRes.data?.current;
      const condition = WMO_CODES[cur?.weathercode] ?? 'Unknown';

      return JSON.stringify({
        location: `${place.name}, ${place.admin1 ?? ''} ${place.country_code ?? ''}`.trim(),
        temperature_f: cur?.temperature_2m,
        feels_like_f: cur?.apparent_temperature,
        humidity_pct: cur?.relative_humidity_2m,
        wind_mph: cur?.windspeed_10m,
        condition,
      });
    } catch (error) {
      const msg =
        axios.isAxiosError(error) && error.response
          ? `Weather fetch failed: ${error.response.status}`
          : 'Weather fetch failed. Check internet connection.';
      return JSON.stringify({error: msg});
    }
  },
};
