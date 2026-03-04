import {
  resolveSystemPrompt,
  resolveSystemMessages,
} from '../systemPromptResolver';
import type {Pal} from '../../types/pal';
import type {Model} from '../types';

describe('systemPromptResolver', () => {
  describe('resolveSystemPrompt', () => {
    it('should return parametrized pal system prompt when pal has parameters', () => {
      const pal: Partial<Pal> = {
        systemPrompt: 'You are {{name}}, a {{role}} in {{setting}}.',
        parameters: {
          name: 'Gandalf',
          role: 'wizard',
          setting: 'Middle-earth',
        },
      };

      const result = resolveSystemPrompt({pal: pal as Pal});

      expect(result).toBe('You are Gandalf, a wizard in Middle-earth.');
    });

    it('should return pal system prompt as-is when pal has no parameters', () => {
      const pal: Partial<Pal> = {
        systemPrompt: 'You are a helpful assistant.',
        parameters: {},
      };

      const result = resolveSystemPrompt({pal: pal as Pal});

      expect(result).toBe('You are a helpful assistant.');
    });

    it('should return pal system prompt as-is when pal has undefined parameters', () => {
      const pal: Partial<Pal> = {
        systemPrompt: 'You are a helpful assistant.',
        parameters: undefined,
      };

      const result = resolveSystemPrompt({pal: pal as Pal});

      expect(result).toBe('You are a helpful assistant.');
    });

    it('should fallback to model chat template when pal has no system prompt', () => {
      const pal: Partial<Pal> = {
        systemPrompt: undefined,
      };

      const activeModel: Partial<Model> = {
        chatTemplate: {
          systemPrompt: 'Model default system prompt',
          addGenerationPrompt: false,
          name: '',
          bosToken: '',
          eosToken: '',
          chatTemplate: '',
        },
      };

      const result = resolveSystemPrompt({
        pal: pal as Pal,
        model: activeModel as Model,
      });

      expect(result).toBe('Model default system prompt');
    });

    it('should fallback to model chat template when pal is null', () => {
      const activeModel: Partial<Model> = {
        chatTemplate: {
          systemPrompt: 'Model default system prompt',
          addGenerationPrompt: false,
          name: '',
          bosToken: '',
          eosToken: '',
          chatTemplate: '',
        },
      };

      const result = resolveSystemPrompt({
        pal: null,
        model: activeModel as Model,
      });

      expect(result).toBe('Model default system prompt');
    });

    it('should return empty string when no pal and no model system prompt', () => {
      const result = resolveSystemPrompt({
        pal: null,
        model: null,
      });

      expect(result).toBe('');
    });

    it('should return empty string when model has no chat template', () => {
      const activeModel: Partial<Model> = {
        chatTemplate: undefined,
      };

      const result = resolveSystemPrompt({
        pal: null,
        model: activeModel as Model,
      });

      expect(result).toBe('');
    });

    it('should prioritize pal system prompt over model system prompt', () => {
      const pal: Partial<Pal> = {
        systemPrompt: 'Pal system prompt',
        parameters: {},
      };

      const activeModel: Partial<Model> = {
        chatTemplate: {
          systemPrompt: 'Model system prompt',
          addGenerationPrompt: false,
          name: '',
          bosToken: '',
          eosToken: '',
          chatTemplate: '',
        },
      };

      const result = resolveSystemPrompt({
        pal: pal as Pal,
        model: activeModel as Model,
      });

      expect(result).toBe('Pal system prompt');
    });
  });

  describe('resolveSystemMessages', () => {
    it('should return system message with prompt + datetime when system prompt exists', () => {
      const pal: Partial<Pal> = {
        systemPrompt: 'You are a helpful assistant.',
        parameters: {},
      };

      const result = resolveSystemMessages({pal: pal as Pal});

      expect(result).toHaveLength(1);
      expect(result[0].role).toBe('system');
      expect(result[0].content).toContain('You are a helpful assistant.');
      expect(result[0].content).toContain('Current date and time:');
    });

    it('should return system message with datetime only when no system prompt', () => {
      const result = resolveSystemMessages({
        pal: null,
        model: null,
      });

      expect(result).toHaveLength(1);
      expect(result[0].role).toBe('system');
      expect(result[0].content).toContain('Current date and time:');
    });

    it('should return datetime-only message when system prompt is whitespace only', () => {
      const activeModel: Partial<Model> = {
        chatTemplate: {
          systemPrompt: '   \n\t  ',
          addGenerationPrompt: false,
          name: '',
          bosToken: '',
          eosToken: '',
          chatTemplate: '',
        },
      };

      const result = resolveSystemMessages({
        pal: null,
        model: activeModel as Model,
      });

      expect(result).toHaveLength(1);
      expect(result[0].content).toContain('Current date and time:');
    });

    it('should return system message with rendered prompt + datetime for parametrized pal', () => {
      const pal: Partial<Pal> = {
        systemPrompt: 'You are {{name}}, a {{role}}.',
        parameters: {
          name: 'Alice',
          role: 'teacher',
        },
      };

      const result = resolveSystemMessages({pal: pal as Pal});

      expect(result).toHaveLength(1);
      expect(result[0].role).toBe('system');
      expect(result[0].content).toContain('You are Alice, a teacher.');
      expect(result[0].content).toContain('Current date and time:');
    });
  });
});
