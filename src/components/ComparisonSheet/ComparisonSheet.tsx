import React, {useState, useCallback, memo} from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

import {Button, Chip, Text, TextInput} from 'react-native-paper';
import {observer} from 'mobx-react';

import {Sheet} from '../Sheet/Sheet';
import {modelStore} from '../../store';
import {
  useModelComparison,
  ComparisonResult,
} from '../../hooks/useModelComparison';
import {useTheme} from '../../hooks';

interface ComparisonSheetProps {
  isVisible: boolean;
  onClose: () => void;
}

interface ResultCardProps {
  result: ComparisonResult;
  onContinueWith: (result: ComparisonResult) => void;
}

const ResultCard = memo(({result, onContinueWith}: ResultCardProps) => {
  const theme = useTheme();

  const formatTime = (ms: number): string => {
    if (ms < 1000) {
      return `${ms}ms`;
    }
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const cardBg =
    result.status === 'error'
      ? theme.colors.errorContainer
      : theme.colors.surfaceVariant;

  return (
    <View
      style={[
        styles.card,
        {backgroundColor: cardBg, borderColor: theme.colors.outline},
      ]}>
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.modelBadge,
            {backgroundColor: theme.colors.primaryContainer},
          ]}>
          <Text
            variant="labelSmall"
            style={{color: theme.colors.onPrimaryContainer}}
            numberOfLines={1}>
            {result.modelName}
          </Text>
        </View>
        {result.status === 'loading' && (
          <Text
            variant="bodySmall"
            style={{color: theme.colors.onSurfaceVariant}}>
            Loading…
          </Text>
        )}
        {result.status === 'generating' && (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        )}
        {result.status === 'done' && (
          <Text
            variant="bodySmall"
            style={{color: theme.colors.onSurfaceVariant}}>
            {result.tokenCount} tok · {formatTime(result.generationTime)}
          </Text>
        )}
      </View>

      {result.status === 'error' && (
        <Text
          variant="bodySmall"
          style={[styles.responseText, {color: theme.colors.error}]}>
          {result.error ?? 'Unknown error'}
        </Text>
      )}

      {(result.status === 'generating' || result.status === 'done') &&
        result.text.length > 0 && (
          <Text
            variant="bodyMedium"
            style={[styles.responseText, {color: theme.colors.onSurface}]}>
            {result.text}
          </Text>
        )}

      {result.status === 'done' && (
        <TouchableOpacity
          style={[
            styles.continueBtn,
            {borderColor: theme.colors.primary},
          ]}
          onPress={() => onContinueWith(result)}>
          <Text variant="labelMedium" style={{color: theme.colors.primary}}>
            Continue with this model
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

export const ComparisonSheet: React.FC<ComparisonSheetProps> = observer(
  ({isVisible, onClose}) => {
    const theme = useTheme();
    const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);
    const [prompt, setPrompt] = useState('');
    const {results, isRunning, runComparison, cancel, reset} =
      useModelComparison();

    const downloadedModels = modelStore.availableModels;
    const hasStarted = results.length > 0;
    const allDone = hasStarted && !isRunning;

    const toggleModel = useCallback((modelId: string) => {
      setSelectedModelIds(prev =>
        prev.includes(modelId)
          ? prev.filter(id => id !== modelId)
          : [...prev, modelId],
      );
    }, []);

    const handleRun = useCallback(async () => {
      await runComparison(selectedModelIds, prompt);
    }, [selectedModelIds, prompt, runComparison]);

    const handleContinueWith = useCallback(
      (result: ComparisonResult) => {
        const model = modelStore.models.find(m => m.id === result.modelId);
        if (model) {
          modelStore.initContext(model);
        }
        reset();
        setSelectedModelIds([]);
        setPrompt('');
        onClose();
      },
      [reset, onClose],
    );

    const handleClose = useCallback(() => {
      if (isRunning) {
        cancel();
      }
      reset();
      setSelectedModelIds([]);
      setPrompt('');
      onClose();
    }, [isRunning, cancel, reset, onClose]);

    const handleNewComparison = useCallback(() => {
      reset();
      setSelectedModelIds([]);
      setPrompt('');
    }, [reset]);

    const canRun =
      selectedModelIds.length >= 2 && prompt.trim().length > 0 && !isRunning;

    return (
      <Sheet title="Compare Models" isVisible={isVisible} onClose={handleClose}>
        <Sheet.ScrollView bottomOffset={24}>
          {!hasStarted && (
            <>
              <Text
                variant="labelMedium"
                style={[
                  styles.sectionLabel,
                  {color: theme.colors.onSurfaceVariant},
                ]}>
                Select 2 or more models
              </Text>

              {downloadedModels.length === 0 ? (
                <Text
                  variant="bodySmall"
                  style={[styles.emptyText, {color: theme.colors.onSurface}]}>
                  No models downloaded. Download models from the Models screen.
                </Text>
              ) : (
                <View style={styles.chipRow}>
                  {downloadedModels.map(model => (
                    <Chip
                      key={model.id}
                      selected={selectedModelIds.includes(model.id)}
                      onPress={() => toggleModel(model.id)}
                      style={styles.chip}
                      compact>
                      {model.name}
                    </Chip>
                  ))}
                </View>
              )}

              <Text
                variant="labelMedium"
                style={[
                  styles.sectionLabel,
                  {color: theme.colors.onSurfaceVariant},
                ]}>
                Prompt
              </Text>
              <TextInput
                mode="outlined"
                multiline
                numberOfLines={4}
                value={prompt}
                onChangeText={setPrompt}
                placeholder="Enter your prompt…"
                style={styles.promptInput}
              />

              <Button
                mode="contained"
                onPress={handleRun}
                disabled={!canRun}
                style={styles.actionBtn}>
                Run Comparison
              </Button>
            </>
          )}

          {hasStarted && (
            <>
              {results.map(result => (
                <ResultCard
                  key={result.modelId}
                  result={result}
                  onContinueWith={handleContinueWith}
                />
              ))}

              {isRunning && (
                <Button
                  mode="outlined"
                  onPress={cancel}
                  textColor={theme.colors.error}
                  style={styles.actionBtn}>
                  Cancel
                </Button>
              )}

              {allDone && (
                <Button
                  mode="outlined"
                  onPress={handleNewComparison}
                  style={styles.actionBtn}>
                  New Comparison
                </Button>
              )}
            </>
          )}
        </Sheet.ScrollView>
      </Sheet>
    );
  },
);

const styles = StyleSheet.create({
  sectionLabel: {
    marginTop: 16,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  chip: {
    marginBottom: 4,
  },
  emptyText: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  promptInput: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  actionBtn: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    maxWidth: '70%',
  },
  responseText: {
    marginBottom: 8,
    lineHeight: 20,
  },
  continueBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
});
