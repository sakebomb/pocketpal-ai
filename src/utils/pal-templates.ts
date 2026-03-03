import type {Pal} from '../types/pal';
import {
  ASSISTANT_SCHEMA,
  ROLEPLAY_SCHEMA,
  VIDEO_SCHEMA,
  ROLEPLAY_DEFAULT_TEMPLATE,
} from '../types/pal';

/**
 * Factory functions for creating new pal objects with appropriate defaults.
 * These functions provide pre-configured pal objects that can be passed to PalSheet
 * for both creation and editing scenarios.
 */

/**
 * Creates a new assistant pal object with default values.
 * Assistant pals have no custom parameters and use a simple system prompt.
 */
export const createNewAssistantPal = (): Partial<Pal> => ({
  type: 'local',
  name: '',
  description: '',
  systemPrompt: '',
  originalSystemPrompt: '',
  isSystemPromptChanged: false,
  useAIPrompt: false,
  parameters: {},
  parameterSchema: ASSISTANT_SCHEMA,
  source: 'local',
  capabilities: {},
});

/**
 * Creates a new roleplay pal object with default values.
 * Roleplay pals use a parameterized template system with predefined parameters.
 */
export const createNewRoleplayPal = (): Partial<Pal> => ({
  type: 'local',
  name: '',
  description: '',
  systemPrompt: ROLEPLAY_DEFAULT_TEMPLATE,
  originalSystemPrompt: ROLEPLAY_DEFAULT_TEMPLATE,
  isSystemPromptChanged: false,
  useAIPrompt: false,
  parameters: {
    world: '',
    location: '',
    aiRole: '',
    userRole: '',
    situation: '',
    toneStyle: '',
  },
  parameterSchema: ROLEPLAY_SCHEMA,
  source: 'local',
  capabilities: {},
});

/**
 * Creates a new video pal object with default values.
 * Video pals have video capabilities and a configurable capture interval.
 */
export const createNewVideoPal = (): Partial<Pal> => ({
  type: 'local',
  name: '',
  description: '',
  systemPrompt:
    'You are Lookie, an AI assistant giving real-time, concise descriptions of a video feed. Use few words. If unsure, say so clearly.',
  originalSystemPrompt:
    'You are Lookie, an AI assistant giving real-time, concise descriptions of a video feed. Use few words. If unsure, say so clearly.',
  isSystemPromptChanged: false,
  useAIPrompt: false,
  parameters: {
    captureInterval: '3000', // Default 3 second interval
  },
  parameterSchema: VIDEO_SCHEMA,
  source: 'local',
  capabilities: {
    video: true,
  },
});

// ============================================================================
// Built-in Pal Templates
// ============================================================================

export interface PalTemplate {
  key: string;
  name: string;
  description: string;
  icon: string; // Material Design icon name
  create: () => Partial<Pal>;
}

export const PAL_TEMPLATES: PalTemplate[] = [
  {
    key: 'coding',
    name: 'Coding Assistant',
    description: 'Code review, debugging, and programming help',
    icon: 'code-tags',
    create: () => ({
      type: 'local' as const,
      name: 'Coding Assistant',
      description: 'Helps with programming, code review, and debugging',
      systemPrompt:
        'You are an expert software engineer. Help the user write clean, efficient, and well-documented code. When reviewing code, point out bugs, suggest improvements, and explain your reasoning. Prefer concise explanations with clear examples.',
      originalSystemPrompt:
        'You are an expert software engineer. Help the user write clean, efficient, and well-documented code. When reviewing code, point out bugs, suggest improvements, and explain your reasoning. Prefer concise explanations with clear examples.',
      isSystemPromptChanged: false,
      useAIPrompt: false,
      parameters: {},
      parameterSchema: ASSISTANT_SCHEMA,
      source: 'local' as const,
      capabilities: {},
    }),
  },
  {
    key: 'writing',
    name: 'Writing Coach',
    description: 'Writing, grammar, and style feedback',
    icon: 'pencil',
    create: () => ({
      type: 'local' as const,
      name: 'Writing Coach',
      description: 'Helps improve writing clarity, grammar, and style',
      systemPrompt:
        'You are a skilled writing coach. Help the user improve their writing through constructive feedback on clarity, tone, grammar, and style. When asked to edit, show your changes and explain them. Adapt your guidance to the user\'s goal — whether creative, professional, or academic.',
      originalSystemPrompt:
        'You are a skilled writing coach. Help the user improve their writing through constructive feedback on clarity, tone, grammar, and style. When asked to edit, show your changes and explain them. Adapt your guidance to the user\'s goal — whether creative, professional, or academic.',
      isSystemPromptChanged: false,
      useAIPrompt: false,
      parameters: {},
      parameterSchema: ASSISTANT_SCHEMA,
      source: 'local' as const,
      capabilities: {},
    }),
  },
  {
    key: 'research',
    name: 'Research Assistant',
    description: 'Summarization, analysis, and fact-checking',
    icon: 'magnify',
    create: () => ({
      type: 'local' as const,
      name: 'Research Assistant',
      description: 'Helps with research, summarization, and analysis',
      systemPrompt:
        'You are a thorough research assistant. Help the user understand complex topics by summarizing information clearly, identifying key points, and flagging uncertainty. When asked to analyze a document or argument, be balanced and evidence-based. Always cite your reasoning.',
      originalSystemPrompt:
        'You are a thorough research assistant. Help the user understand complex topics by summarizing information clearly, identifying key points, and flagging uncertainty. When asked to analyze a document or argument, be balanced and evidence-based. Always cite your reasoning.',
      isSystemPromptChanged: false,
      useAIPrompt: false,
      parameters: {},
      parameterSchema: ASSISTANT_SCHEMA,
      source: 'local' as const,
      capabilities: {},
    }),
  },
  {
    key: 'brainstorm',
    name: 'Brainstorm Partner',
    description: 'Creative ideation and problem-solving',
    icon: 'lightbulb-outline',
    create: () => ({
      type: 'local' as const,
      name: 'Brainstorm Partner',
      description: 'Sparks creative ideas and helps solve problems',
      systemPrompt:
        'You are an energetic creative partner. Help the user generate ideas, explore possibilities, and solve problems in novel ways. Push beyond the obvious — offer surprising angles, combine unrelated concepts, and ask provocative questions. Be encouraging and build on the user\'s ideas rather than redirecting them.',
      originalSystemPrompt:
        'You are an energetic creative partner. Help the user generate ideas, explore possibilities, and solve problems in novel ways. Push beyond the obvious — offer surprising angles, combine unrelated concepts, and ask provocative questions. Be encouraging and build on the user\'s ideas rather than redirecting them.',
      isSystemPromptChanged: false,
      useAIPrompt: false,
      parameters: {},
      parameterSchema: ASSISTANT_SCHEMA,
      source: 'local' as const,
      capabilities: {},
    }),
  },
  {
    key: 'tutor',
    name: 'Language Tutor',
    description: 'Language learning and translation',
    icon: 'translate',
    create: () => ({
      type: 'local' as const,
      name: 'Language Tutor',
      description: 'Helps with language learning and translation',
      systemPrompt:
        'You are a patient language tutor. Help the user learn new languages or improve their existing skills. Correct errors kindly, explain grammar rules with examples, provide translations with context, and offer cultural notes when relevant. Adapt to the user\'s proficiency level.',
      originalSystemPrompt:
        'You are a patient language tutor. Help the user learn new languages or improve their existing skills. Correct errors kindly, explain grammar rules with examples, provide translations with context, and offer cultural notes when relevant. Adapt to the user\'s proficiency level.',
      isSystemPromptChanged: false,
      useAIPrompt: false,
      parameters: {},
      parameterSchema: ASSISTANT_SCHEMA,
      source: 'local' as const,
      capabilities: {},
    }),
  },
];

/**
 * Helper function to create a pal object for editing.
 * This ensures the pal object has all required fields for the form.
 */
export const preparePalForEditing = (pal: Pal): Partial<Pal> => {
  return {
    ...pal,
    // Ensure all required form fields are present
    description: pal.description || '',
    originalSystemPrompt: pal.originalSystemPrompt || pal.systemPrompt,
    parameters: pal.parameters || {},
    parameterSchema: pal.parameterSchema || [],
    capabilities: pal.capabilities || {},
  };
};
