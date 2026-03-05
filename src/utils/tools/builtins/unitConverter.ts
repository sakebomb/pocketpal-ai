import type {RegisteredTool} from '../types';

type ConversionMap = Record<string, Record<string, number>>;

// All values are multipliers TO the base unit, then FROM base unit
// base units: meter, kg, celsius (special), liter, square-meter, km/h
const CONVERSIONS: ConversionMap = {
  length: {
    meter: 1, km: 1000, cm: 0.01, mm: 0.001, mile: 1609.344,
    yard: 0.9144, foot: 0.3048, feet: 0.3048, inch: 0.0254, inches: 0.0254,
    nautical_mile: 1852,
  },
  weight: {
    kg: 1, gram: 0.001, g: 0.001, lb: 0.453592, lbs: 0.453592,
    pound: 0.453592, pounds: 0.453592, oz: 0.0283495, ounce: 0.0283495,
    stone: 6.35029, ton: 1000, tonne: 1000,
  },
  volume: {
    liter: 1, l: 1, ml: 0.001, gallon: 3.78541, quart: 0.946353,
    pint: 0.473176, cup: 0.24, fl_oz: 0.0295735, tablespoon: 0.0147868,
    teaspoon: 0.00492892, cubic_meter: 1000,
  },
  area: {
    square_meter: 1, sqm: 1, square_km: 1e6, hectare: 10000, acre: 4046.86,
    square_mile: 2589988, square_foot: 0.092903, sqft: 0.092903,
    square_yard: 0.836127, square_inch: 0.00064516,
  },
  speed: {
    'km/h': 1, kph: 1, 'mph': 1.60934, 'km/s': 3600, 'mps': 3.6,
    knot: 1.852, knots: 1.852,
  },
  data: {
    byte: 1, bytes: 1, kb: 1024, mb: 1048576, gb: 1073741824,
    tb: 1099511627776, bit: 0.125, bits: 0.125,
  },
};

function normalise(unit: string): string {
  return unit.toLowerCase().replace(/\s+/g, '_').replace(/s$/, '').replace(/s$/, '');
}

function findCategory(unit: string): string | null {
  const u = normalise(unit);
  for (const [cat, map] of Object.entries(CONVERSIONS)) {
    if (u in map) return cat;
    // Try with trailing s
    if (u + 's' in map) return cat;
  }
  return null;
}

function getFactor(cat: string, unit: string): number | null {
  const map = CONVERSIONS[cat];
  const u = normalise(unit);
  return map[u] ?? map[u + 's'] ?? null;
}

export const unitConverterTool: RegisteredTool = {
  definition: {
    type: 'function',
    function: {
      name: 'convert_units',
      description:
        'Convert between units of measurement (length, weight, volume, area, speed, data). Also handles Celsius ↔ Fahrenheit ↔ Kelvin. Use for questions like "5 km in miles" or "72°F in Celsius".',
      parameters: {
        type: 'object',
        properties: {
          value: {
            type: 'string',
            description: 'The numeric value to convert (e.g. "100").',
          },
          from_unit: {
            type: 'string',
            description: 'The unit to convert from (e.g. "km", "lbs", "Fahrenheit").',
          },
          to_unit: {
            type: 'string',
            description: 'The unit to convert to (e.g. "miles", "kg", "Celsius").',
          },
        },
        required: ['value', 'from_unit', 'to_unit'],
      },
    },
  },
  handler: async (args: Record<string, unknown>): Promise<string> => {
    const value = parseFloat(String(args.value ?? '0'));
    const fromUnit = String(args.from_unit ?? '').trim();
    const toUnit = String(args.to_unit ?? '').trim();

    if (isNaN(value)) {
      return JSON.stringify({error: 'Invalid numeric value.'});
    }

    // Temperature — special case (offsets, not ratios)
    const tempAliases: Record<string, string> = {
      celsius: 'c', c: 'c', '°c': 'c',
      fahrenheit: 'f', f: 'f', '°f': 'f',
      kelvin: 'k', k: 'k',
    };
    const fromTemp = tempAliases[fromUnit.toLowerCase()];
    const toTemp = tempAliases[toUnit.toLowerCase()];

    if (fromTemp && toTemp) {
      let celsius: number;
      switch (fromTemp) {
        case 'f': celsius = (value - 32) * 5 / 9; break;
        case 'k': celsius = value - 273.15; break;
        default:  celsius = value;
      }
      let result: number;
      switch (toTemp) {
        case 'f': result = celsius * 9 / 5 + 32; break;
        case 'k': result = celsius + 273.15; break;
        default:  result = celsius;
      }
      return JSON.stringify({
        value, from_unit: fromUnit, to_unit: toUnit,
        result: parseFloat(result.toFixed(4)),
      });
    }

    const cat = findCategory(fromUnit);
    if (!cat) {
      return JSON.stringify({error: `Unknown unit: "${fromUnit}". Supported: length, weight, volume, area, speed, data, temperature.`});
    }
    if (findCategory(toUnit) !== cat) {
      return JSON.stringify({error: `Cannot convert "${fromUnit}" to "${toUnit}" — they are different types of measurement.`});
    }

    const fromFactor = getFactor(cat, fromUnit)!;
    const toFactor = getFactor(cat, toUnit)!;
    const result = (value * fromFactor) / toFactor;

    return JSON.stringify({
      value, from_unit: fromUnit, to_unit: toUnit,
      result: parseFloat(result.toFixed(6)),
      category: cat,
    });
  },
};
