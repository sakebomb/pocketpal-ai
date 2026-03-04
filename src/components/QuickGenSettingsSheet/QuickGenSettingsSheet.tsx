import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {Button, Text, TextInput} from 'react-native-paper';

import {Sheet} from '../Sheet/Sheet';
import {InputSlider} from '../InputSlider';
import {chatSessionStore, defaultCompletionSettings} from '../../store';
import {CompletionParams} from '../../utils/completionTypes';
import {useTheme} from '../../hooks';
import {
  presetRepository,
  PresetInfo,
} from '../../repositories/PresetRepository';

interface QuickGenSettingsSheetProps {
  isVisible: boolean;
  onClose: () => void;
}

export const QuickGenSettingsSheet: React.FC<QuickGenSettingsSheetProps> = ({
  isVisible,
  onClose,
}) => {
  const theme = useTheme();

  const activeSession = chatSessionStore.activeSessionId
    ? chatSessionStore.sessions.find(
        s => s.id === chatSessionStore.activeSessionId,
      )
    : null;

  const sourceSettings: CompletionParams =
    activeSession?.completionSettings ?? defaultCompletionSettings;

  const [temperature, setTemperature] = useState(
    sourceSettings.temperature ?? 0.7,
  );
  const [topP, setTopP] = useState(sourceSettings.top_p ?? 0.95);
  const [maxTokens, setMaxTokens] = useState(
    sourceSettings.n_predict ?? 1024,
  );

  const [presets, setPresets] = useState<PresetInfo[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveNameInput, setSaveNameInput] = useState('');

  const loadPresets = useCallback(async () => {
    const all = await presetRepository.getAllPresets();
    setPresets(all);
  }, []);

  // Sync sliders and load presets when sheet opens or session changes
  useEffect(() => {
    if (isVisible) {
      const s =
        chatSessionStore.activeSessionId
          ? chatSessionStore.sessions.find(
              ss => ss.id === chatSessionStore.activeSessionId,
            )?.completionSettings
          : null;
      setTemperature(s?.temperature ?? defaultCompletionSettings.temperature ?? 0.7);
      setTopP(s?.top_p ?? defaultCompletionSettings.top_p ?? 0.95);
      setMaxTokens(s?.n_predict ?? defaultCompletionSettings.n_predict ?? 1024);
      setIsSaving(false);
      setSaveNameInput('');
      loadPresets();
    }
  }, [isVisible, chatSessionStore.activeSessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyPreset = (preset: PresetInfo) => {
    setTemperature(preset.settings.temperature);
    setTopP(preset.settings.top_p);
    setMaxTokens(preset.settings.n_predict);
  };

  const handleSavePreset = async () => {
    const name = saveNameInput.trim();
    if (!name) {
      return;
    }
    await presetRepository.addPreset(name, {
      temperature,
      top_p: topP,
      n_predict: maxTokens,
    });
    setSaveNameInput('');
    setIsSaving(false);
    await loadPresets();
  };

  const handleDeletePreset = (preset: PresetInfo) => {
    Alert.alert('Delete preset', `Delete "${preset.name}"?`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await presetRepository.deletePreset(preset.id);
          await loadPresets();
        },
      },
    ]);
  };

  const handleSave = async () => {
    const updated: CompletionParams = {
      ...sourceSettings,
      temperature,
      top_p: topP,
      n_predict: maxTokens,
    };
    await chatSessionStore.updateSessionCompletionSettings(updated);
    onClose();
  };

  const handleReset = () => {
    setTemperature(defaultCompletionSettings.temperature ?? 0.7);
    setTopP(defaultCompletionSettings.top_p ?? 0.95);
    setMaxTokens(defaultCompletionSettings.n_predict ?? 1024);
  };

  return (
    <Sheet title="Generation Settings" isVisible={isVisible} onClose={onClose}>
      <Sheet.ScrollView bottomOffset={16}>
        <View style={styles.content}>
          {/* Preset chips */}
          <Text
            style={[styles.sectionLabel, {color: theme.colors.onSurfaceVariant}]}>
            Presets
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.presetsRow}
            contentContainerStyle={styles.presetsContent}>
            {presets.map(preset => (
              <TouchableOpacity
                key={preset.id}
                style={[
                  styles.presetChip,
                  {
                    borderColor: theme.colors.outline,
                    backgroundColor: theme.colors.surfaceVariant,
                  },
                ]}
                onPress={() => applyPreset(preset)}
                onLongPress={() =>
                  !preset.builtIn && handleDeletePreset(preset)
                }>
                <Text
                  style={[
                    styles.presetChipText,
                    {color: theme.colors.onSurfaceVariant},
                  ]}>
                  {preset.name}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[
                styles.presetChip,
                styles.addChip,
                {borderColor: theme.colors.primary},
              ]}
              onPress={() => setIsSaving(v => !v)}>
              <Text style={[styles.presetChipText, {color: theme.colors.primary}]}>
                + Save
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {isSaving && (
            <View style={styles.saveRow}>
              <TextInput
                mode="outlined"
                dense
                placeholder="Preset name"
                value={saveNameInput}
                onChangeText={setSaveNameInput}
                style={styles.saveInput}
                autoFocus
              />
              <Button
                mode="contained"
                compact
                disabled={!saveNameInput.trim()}
                onPress={handleSavePreset}
                buttonColor={theme.colors.primary}>
                Save
              </Button>
            </View>
          )}

          <View style={styles.divider} />

          <InputSlider
            label="Temperature"
            description="Controls randomness. Lower = more focused, higher = more creative."
            value={temperature}
            onValueChange={setTemperature}
            min={0}
            max={2}
            step={0.01}
            precision={2}
            testID="quick-temperature-slider"
          />

          <View style={styles.divider} />

          <InputSlider
            label="Top-p"
            description="Nucleus sampling threshold. Lower values keep only the most likely tokens."
            value={topP}
            onValueChange={setTopP}
            min={0}
            max={1}
            step={0.01}
            precision={2}
            testID="quick-top-p-slider"
          />

          <View style={styles.divider} />

          <InputSlider
            label="Max tokens"
            description="Maximum number of tokens to generate per response."
            value={maxTokens}
            onValueChange={v => setMaxTokens(Math.round(v))}
            min={64}
            max={8192}
            step={64}
            precision={0}
            testID="quick-max-tokens-slider"
          />

          <View style={styles.actions}>
            <Button mode="text" onPress={handleReset}>
              Reset to defaults
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              buttonColor={theme.colors.primary}>
              Apply
            </Button>
          </View>
        </View>
      </Sheet.ScrollView>
    </Sheet>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  presetsRow: {
    flexGrow: 0,
  },
  presetsContent: {
    gap: 8,
    paddingRight: 4,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  addChip: {
    borderStyle: 'dashed',
  },
  presetChipText: {
    fontSize: 13,
  },
  saveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  saveInput: {
    flex: 1,
    fontSize: 14,
  },
  divider: {
    height: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
  },
});
