import type {Pal} from '../types/pal';
import type {Model} from './types';
import {generateFinalSystemPrompt} from './palshub-template-parser';

export interface SystemPromptDependencies {
  pal?: Pal | null;
  model?: Model | null;
}

/**
 * Resolves the system prompt based on priority:
 * 1. Pal's system prompt (with parameter rendering if needed)
 * 2. Fallback to model's chat template system prompt
 * 3. Empty string if neither exists
 */
export function resolveSystemPrompt(
  dependencies: SystemPromptDependencies,
): string {
  const {pal, model} = dependencies;

  // Priority 1: Pal's system prompt
  if (pal?.systemPrompt) {
    // Check if the pal has parameters that need rendering
    if (pal.parameters && Object.keys(pal.parameters).length > 0) {
      return generateFinalSystemPrompt(pal.systemPrompt, pal.parameters);
    } else {
      return pal.systemPrompt;
    }
  }

  // Priority 2: Model's chat template system prompt
  if (model?.chatTemplate?.systemPrompt) {
    return model.chatTemplate.systemPrompt;
  }

  // Priority 3: Empty string
  return '';
}

/**
 * Returns the current date/time as a short injected line for the system prompt.
 * Format: "Current date and time: Wednesday, March 4, 2026 at 10:30 AM"
 */
function buildDateTimeLine(): string {
  return `Current date and time: ${new Date().toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })}.`;
}

/**
 * Resolves system prompt and formats it as a system message array.
 * Always appends the current date/time so the model can answer
 * time-sensitive questions without a tool call.
 */
export function resolveSystemMessages(
  dependencies: SystemPromptDependencies,
): Array<{role: 'system'; content: string}> {
  const systemPrompt = resolveSystemPrompt(dependencies);
  const dateTimeLine = buildDateTimeLine();

  const content = systemPrompt.trim()
    ? `${systemPrompt}\n\n${dateTimeLine}`
    : dateTimeLine;

  return [
    {
      role: 'system' as const,
      content,
    },
  ];
}
