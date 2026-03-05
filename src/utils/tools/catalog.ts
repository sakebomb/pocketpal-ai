import type {PalCapabilities} from '../../types/pal';

export type ToolCategory = 'live' | 'reference' | 'utility' | 'search';

export interface ToolCatalogEntry {
  /** The PalCapabilities flag that controls this tool */
  capabilityKey: keyof PalCapabilities;
  name: string;
  description: string;
  category: ToolCategory;
  /** True if an API key must be configured before this tool is useful */
  requiresApiKey?: boolean;
  /** Where the user sets the API key (shown as a hint) */
  apiKeyHint?: string;
}

/**
 * All user-selectable tools, in display order.
 * time + calculator are always-on (BASE_REGISTRY) and are not listed here.
 */
export const TOOL_CATALOG: ToolCatalogEntry[] = [
  // ── Live Data ────────────────────────────────────────────────
  {
    capabilityKey: 'weather',
    name: 'Weather',
    description: 'Current conditions for any location via Open-Meteo.',
    category: 'live',
  },
  {
    capabilityKey: 'hackerNews',
    name: 'Hacker News',
    description: 'Top tech stories from news.ycombinator.com.',
    category: 'live',
  },
  {
    capabilityKey: 'crypto',
    name: 'Crypto Prices',
    description: 'Live price, market cap, and 24h change via CoinGecko.',
    category: 'live',
  },
  {
    capabilityKey: 'stocks',
    name: 'Stock Prices',
    description: 'Current stock price and daily change via Yahoo Finance.',
    category: 'live',
  },
  {
    capabilityKey: 'sports',
    name: 'Sports Scores',
    description: 'Recent match results for any team via TheSportsDB.',
    category: 'live',
  },
  {
    capabilityKey: 'reddit',
    name: 'Reddit',
    description: 'Browse or search any subreddit for top posts.',
    category: 'live',
  },
  {
    capabilityKey: 'flights',
    name: 'Flight Tracker',
    description: 'Real-time flight status by flight number.',
    category: 'live',
    requiresApiKey: true,
    apiKeyHint: 'Add AviationStack key in Settings → API Keys',
  },
  // ── Reference ────────────────────────────────────────────────
  {
    capabilityKey: 'wikipedia',
    name: 'Wikipedia',
    description: 'Look up people, places, and concepts.',
    category: 'reference',
  },
  {
    capabilityKey: 'dictionary',
    name: 'Dictionary',
    description: 'English definitions, pronunciation, and examples.',
    category: 'reference',
  },
  {
    capabilityKey: 'movies',
    name: 'Movies & TV',
    description: 'Plot, ratings, and cast for any film or series.',
    category: 'reference',
    requiresApiKey: true,
    apiKeyHint: 'Add OMDB key in Settings → API Keys',
  },
  {
    capabilityKey: 'books',
    name: 'Books',
    description: 'Search books by title, author, or ISBN via Open Library.',
    category: 'reference',
  },
  {
    capabilityKey: 'arxiv',
    name: 'arXiv Papers',
    description: 'Search recent research papers by topic or author.',
    category: 'reference',
  },
  {
    capabilityKey: 'github',
    name: 'GitHub',
    description: 'Search repositories by topic, language, or keywords.',
    category: 'reference',
  },
  {
    capabilityKey: 'trivia',
    name: 'Trivia',
    description: 'Random quiz questions across categories and difficulty.',
    category: 'reference',
  },
  {
    capabilityKey: 'nutrition',
    name: 'Nutrition',
    description: 'Nutritional info for any food via Open Food Facts.',
    category: 'reference',
  },
  {
    capabilityKey: 'recipe',
    name: 'Recipes',
    description: 'Search recipes by dish name or ingredient via TheMealDB.',
    category: 'reference',
  },
  // ── Utilities ────────────────────────────────────────────────
  {
    capabilityKey: 'currency',
    name: 'Currency Converter',
    description: 'Live exchange rates for 30+ currencies.',
    category: 'utility',
  },
  {
    capabilityKey: 'unitConvert',
    name: 'Unit Converter',
    description: 'Length, weight, volume, temperature, speed, and more.',
    category: 'utility',
  },
  {
    capabilityKey: 'translate',
    name: 'Translate',
    description: 'Translate text between languages (1000 req/day free).',
    category: 'utility',
  },
  {
    capabilityKey: 'worldClock',
    name: 'World Clock',
    description: 'Current time in any city or timezone.',
    category: 'utility',
  },
  {
    capabilityKey: 'urlReader',
    name: 'URL Reader',
    description: 'Fetch and read any web page (via Jina).',
    category: 'utility',
  },
  {
    capabilityKey: 'memory',
    name: 'Memory',
    description: 'Remember facts across conversations (stored on device).',
    category: 'utility',
  },
  // ── Web Search — API key required ────────────────────────────
  {
    capabilityKey: 'web',
    name: 'Tavily Search',
    description: 'High-quality web search. 1000 free queries/month.',
    category: 'search',
    requiresApiKey: true,
    apiKeyHint: 'Add Tavily key in Settings → API Keys',
  },
  {
    capabilityKey: 'brave',
    name: 'Brave Search',
    description: 'Privacy-focused web search. 2000 free queries/month.',
    category: 'search',
    requiresApiKey: true,
    apiKeyHint: 'Add Brave key in Settings → API Keys',
  },
  {
    capabilityKey: 'serper',
    name: 'Serper (Google)',
    description: 'Google search results. 2500 free queries/month.',
    category: 'search',
    requiresApiKey: true,
    apiKeyHint: 'Add Serper key in Settings → API Keys',
  },
];
