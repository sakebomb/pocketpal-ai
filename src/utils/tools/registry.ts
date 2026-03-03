import type {Pal} from '../../types/pal';
import {
  hasToolsCapability,
  hasWebCapability,
  hasMemoryCapability,
} from '../pal-capabilities';
import {getCurrentTimeTool} from './builtins/getCurrentTime';
import {webSearchTool} from './builtins/webSearch';
import {createMemoryStoreTool} from './builtins/memoryStore';
import {calculateTool} from './builtins/calculate';
import type {ToolDefinition, ToolHandler, RegisteredTool} from './types';

/**
 * Base tools available to any Pal with the `tools` capability.
 */
const BASE_REGISTRY: Record<string, RegisteredTool> = {
  get_current_time: getCurrentTimeTool,
  calculate: calculateTool,
};

/**
 * Returns the tool definitions and handlers to inject into a completion
 * for the given Pal, based on its capability flags:
 *
 *   tools  → base tools (get_current_time, etc.)
 *   web    → web_search (requires Tavily API key in Settings)
 *   memory → memory_store (persists facts to WatermelonDB, per-Pal)
 *
 * Returns empty lists if the Pal has no `tools` capability.
 */
export function getToolsForPal(pal: Pal | null | undefined): {
  definitions: ToolDefinition[];
  handlers: Record<string, ToolHandler>;
} {
  if (!pal || !hasToolsCapability(pal)) {
    return {definitions: [], handlers: {}};
  }

  const active: Record<string, RegisteredTool> = {...BASE_REGISTRY};

  if (hasWebCapability(pal)) {
    active.web_search = webSearchTool;
  }

  if (hasMemoryCapability(pal) && pal.id) {
    active.memory_store = createMemoryStoreTool(pal.id);
  }

  const definitions = Object.values(active).map(t => t.definition);
  const handlers = Object.fromEntries(
    Object.entries(active).map(([name, t]) => [name, t.handler]),
  );
  return {definitions, handlers};
}
