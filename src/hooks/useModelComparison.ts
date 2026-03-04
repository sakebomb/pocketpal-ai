import {useState, useRef} from 'react';

import {modelStore} from '../store';

export interface ComparisonResult {
  modelId: string;
  modelName: string;
  text: string;
  tokenCount: number;
  generationTime: number;
  status: 'pending' | 'loading' | 'generating' | 'done' | 'error';
  error?: string;
}

const STREAM_THROTTLE_MS = 100;

export function useModelComparison() {
  const [results, setResults] = useState<ComparisonResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const cancelRef = useRef(false);

  const updateResult = (index: number, update: Partial<ComparisonResult>) => {
    setResults(prev => {
      const next = [...prev];
      next[index] = {...next[index], ...update};
      return next;
    });
  };

  const runComparison = async (modelIds: string[], prompt: string) => {
    if (isRunning || modelIds.length < 2 || !prompt.trim()) {
      return;
    }

    cancelRef.current = false;
    setIsRunning(true);
    setResults(
      modelIds.map(id => ({
        modelId: id,
        modelName: modelStore.models.find(m => m.id === id)?.name ?? id,
        text: '',
        tokenCount: 0,
        generationTime: 0,
        status: 'pending' as const,
      })),
    );

    try {
      for (let i = 0; i < modelIds.length; i++) {
        if (cancelRef.current) {
          break;
        }

        const model = modelStore.models.find(m => m.id === modelIds[i]);
        if (!model) {
          updateResult(i, {status: 'error', error: 'Model not found'});
          continue;
        }

        updateResult(i, {status: 'loading'});

        try {
          const ctx = await modelStore.initContext(model);
          if (!ctx) {
            updateResult(i, {
              status: 'error',
              error: cancelRef.current ? 'Cancelled' : 'Failed to load model',
            });
            await modelStore.releaseContext(true);
            continue;
          }

          if (cancelRef.current) {
            updateResult(i, {status: 'error', error: 'Cancelled'});
            await modelStore.releaseContext(true);
            continue;
          }

          updateResult(i, {status: 'generating', text: ''});

          const startTime = Date.now();
          let streamedText = '';
          let lastUpdateTime = 0;

          const completionParams = {
            messages: [{role: 'user' as const, content: prompt.trim()}],
            n_predict: 512,
            temperature: 0.7,
            top_p: 0.95,
            top_k: 40,
          };

          const completionPromise = (ctx as any).completion(
            completionParams,
            (data: {token: string}) => {
              if (cancelRef.current) {
                return;
              }
              streamedText += data.token;
              const now = Date.now();
              if (now - lastUpdateTime >= STREAM_THROTTLE_MS) {
                lastUpdateTime = now;
                updateResult(i, {text: streamedText});
              }
            },
          );

          modelStore.registerCompletionPromise(completionPromise);
          let result: any;
          try {
            result = await completionPromise;
          } finally {
            modelStore.clearCompletionPromise();
          }

          const elapsed = Date.now() - startTime;

          if (cancelRef.current) {
            updateResult(i, {status: 'error', error: 'Cancelled'});
          } else {
            const tokCount =
              result?.timings?.predicted_n ??
              result?.usage?.completion_tokens ??
              0;
            updateResult(i, {
              status: 'done',
              text: result?.text ?? streamedText,
              tokenCount: tokCount,
              generationTime: elapsed,
            });
          }
        } catch (e: any) {
          updateResult(i, {
            status: 'error',
            error: e?.message ?? 'Unknown error',
          });
        } finally {
          await modelStore.releaseContext(true);
        }
      }
    } finally {
      setIsRunning(false);
    }
  };

  const cancel = () => {
    cancelRef.current = true;
  };

  const reset = () => {
    setResults([]);
    setIsRunning(false);
    cancelRef.current = false;
  };

  return {results, isRunning, runComparison, cancel, reset};
}
