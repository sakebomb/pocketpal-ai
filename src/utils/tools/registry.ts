import type {Pal} from '../../types/pal';
import {
  hasToolsCapability,
  hasWeatherCapability,
  hasWikipediaCapability,
  hasUrlReaderCapability,
  hasCurrencyCapability,
  hasUnitConvertCapability,
  hasDictionaryCapability,
  hasTranslateCapability,
  hasHackerNewsCapability,
  hasWebCapability,
  hasBraveCapability,
  hasMemoryCapability,
  hasCryptoCapability,
  hasStocksCapability,
  hasSportsCapability,
  hasRedditCapability,
  hasFlightsCapability,
  hasMoviesCapability,
  hasBooksCapability,
  hasArxivCapability,
  hasGithubCapability,
  hasTriviaCapability,
  hasNutritionCapability,
  hasRecipeCapability,
  hasWorldClockCapability,
  hasSerperCapability,
} from '../pal-capabilities';
import {getCurrentTimeTool} from './builtins/getCurrentTime';
import {calculateTool} from './builtins/calculate';
import {weatherTool} from './builtins/weather';
import {wikipediaTool} from './builtins/wikipedia';
import {urlReaderTool} from './builtins/urlReader';
import {currencyTool} from './builtins/currency';
import {unitConverterTool} from './builtins/unitConverter';
import {dictionaryTool} from './builtins/dictionary';
import {translateTool} from './builtins/translate';
import {hackerNewsTool} from './builtins/hackerNews';
import {webSearchTool} from './builtins/webSearch';
import {braveSearchTool} from './builtins/braveSearch';
import {createMemoryStoreTool} from './builtins/memoryStore';
import {cryptoPriceTool} from './builtins/cryptoPrice';
import {stockPriceTool} from './builtins/stockPrice';
import {sportsScoresTool} from './builtins/sportsScores';
import {redditTool} from './builtins/reddit';
import {flightTrackerTool} from './builtins/flightTracker';
import {movieSearchTool} from './builtins/movieSearch';
import {bookSearchTool} from './builtins/bookSearch';
import {arxivSearchTool} from './builtins/arxivSearch';
import {githubSearchTool} from './builtins/githubSearch';
import {triviaQuestionTool} from './builtins/triviaQuestion';
import {nutritionLookupTool} from './builtins/nutritionLookup';
import {recipeSearchTool} from './builtins/recipeSearch';
import {worldClockTool} from './builtins/worldClock';
import {serperSearchTool} from './builtins/serperSearch';
import type {ToolDefinition, ToolHandler, RegisteredTool} from './types';

/**
 * Always-on tools: tiny schemas, universally useful, never surprising.
 * Enabled for any Pal with the `tools` capability.
 */
const BASE_REGISTRY: Record<string, RegisteredTool> = {
  get_current_time: getCurrentTimeTool,
  calculate: calculateTool,
};

export function getToolsForPal(pal: Pal | null | undefined): {
  definitions: ToolDefinition[];
  handlers: Record<string, ToolHandler>;
} {
  if (!pal || !hasToolsCapability(pal)) {
    return {definitions: [], handlers: {}};
  }

  const active: Record<string, RegisteredTool> = {...BASE_REGISTRY};

  // Live data
  if (hasWeatherCapability(pal))    active.get_weather      = weatherTool;
  if (hasHackerNewsCapability(pal)) active.hacker_news      = hackerNewsTool;
  if (hasCryptoCapability(pal))     active.crypto_price     = cryptoPriceTool;
  if (hasStocksCapability(pal))     active.stock_price      = stockPriceTool;
  if (hasSportsCapability(pal))     active.sports_scores    = sportsScoresTool;
  if (hasRedditCapability(pal))     active.reddit_posts     = redditTool;
  if (hasFlightsCapability(pal))    active.flight_status    = flightTrackerTool;

  // Reference
  if (hasWikipediaCapability(pal))  active.wikipedia_search = wikipediaTool;
  if (hasDictionaryCapability(pal)) active.dictionary_lookup = dictionaryTool;
  if (hasMoviesCapability(pal))     active.movie_search     = movieSearchTool;
  if (hasBooksCapability(pal))      active.book_search      = bookSearchTool;
  if (hasArxivCapability(pal))      active.arxiv_search     = arxivSearchTool;
  if (hasGithubCapability(pal))     active.github_search    = githubSearchTool;
  if (hasTriviaCapability(pal))     active.trivia_question  = triviaQuestionTool;
  if (hasNutritionCapability(pal))  active.nutrition_lookup = nutritionLookupTool;
  if (hasRecipeCapability(pal))     active.recipe_search    = recipeSearchTool;

  // Utilities
  if (hasCurrencyCapability(pal))    active.convert_currency = currencyTool;
  if (hasUnitConvertCapability(pal)) active.convert_units    = unitConverterTool;
  if (hasTranslateCapability(pal))   active.translate_text   = translateTool;
  if (hasWorldClockCapability(pal))  active.world_clock      = worldClockTool;
  if (hasUrlReaderCapability(pal))   active.read_url         = urlReaderTool;

  // Memory
  if (hasMemoryCapability(pal) && pal.id) {
    active.memory_store = createMemoryStoreTool(pal.id);
  }

  // Web search (API key required)
  if (hasWebCapability(pal))    active.web_search    = webSearchTool;
  if (hasBraveCapability(pal))  active.brave_search  = braveSearchTool;
  if (hasSerperCapability(pal)) active.serper_search = serperSearchTool;

  const definitions = Object.values(active).map(t => t.definition);
  const handlers = Object.fromEntries(
    Object.entries(active).map(([name, t]) => [name, t.handler]),
  );
  return {definitions, handlers};
}
