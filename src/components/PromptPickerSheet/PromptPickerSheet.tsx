import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import {Button} from 'react-native-paper';

import {Sheet} from '..';
import {useTheme} from '../../hooks';
import type {PromptInfo} from '../../repositories/PromptRepository';
import {promptRepository} from '../../repositories/PromptRepository';

interface PromptPickerSheetProps {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (content: string) => void;
}

export const PromptPickerSheet: React.FC<PromptPickerSheetProps> = ({
  isVisible,
  onClose,
  onSelect,
}) => {
  const theme = useTheme();
  const [prompts, setPrompts] = useState<PromptInfo[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [saving, setSaving] = useState(false);

  const loadPrompts = useCallback(async () => {
    try {
      const all = await promptRepository.getAllPrompts();
      setPrompts(all);
    } catch (e) {
      console.error('Failed to load prompts:', e);
    }
  }, []);

  useEffect(() => {
    if (isVisible) {
      loadPrompts();
    }
  }, [isVisible, loadPrompts]);

  const handleSelect = useCallback(
    (prompt: PromptInfo) => {
      onSelect(prompt.content);
      onClose();
    },
    [onSelect, onClose],
  );

  const handleDelete = useCallback(
    (prompt: PromptInfo) => {
      Alert.alert('Delete Prompt', `Delete "${prompt.title}"?`, [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await promptRepository.deletePrompt(prompt.id);
            await loadPrompts();
          },
        },
      ]);
    },
    [loadPrompts],
  );

  const handleSaveNewPrompt = useCallback(async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      return;
    }
    setSaving(true);
    try {
      await promptRepository.addPrompt(newTitle.trim(), newContent.trim());
      setNewTitle('');
      setNewContent('');
      setShowAddForm(false);
      await loadPrompts();
    } catch (e) {
      Alert.alert('Error', 'Failed to save prompt. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [newTitle, newContent, loadPrompts]);

  const handleClose = useCallback(() => {
    setShowAddForm(false);
    setNewTitle('');
    setNewContent('');
    onClose();
  }, [onClose]);

  return (
    <Sheet
      title={showAddForm ? 'New Prompt' : 'Prompt Library'}
      isVisible={isVisible}
      onClose={handleClose}>
      <Sheet.ScrollView bottomOffset={16}>
        {showAddForm ? (
          <View style={styles.addForm}>
            <Text style={[styles.fieldLabel, {color: theme.colors.onSurfaceVariant}]}>Title</Text>
            <TextInput
              style={[styles.textInput, {color: theme.colors.onSurface, borderColor: theme.colors.outline, backgroundColor: theme.colors.surface}]}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="e.g. Explain like I'm five"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              autoFocus
            />
            <Text style={[styles.fieldLabel, {color: theme.colors.onSurfaceVariant}]}>Prompt text</Text>
            <TextInput
              style={[styles.textInput, styles.contentInput, {color: theme.colors.onSurface, borderColor: theme.colors.outline, backgroundColor: theme.colors.surface}]}
              value={newContent}
              onChangeText={setNewContent}
              placeholder="Enter the full prompt text…"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              multiline
              textAlignVertical="top"
            />
            <View style={styles.formActions}>
              <Button
                mode="text"
                onPress={() => {
                  setShowAddForm(false);
                  setNewTitle('');
                  setNewContent('');
                }}>
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSaveNewPrompt}
                loading={saving}
                disabled={
                  saving || !newTitle.trim() || !newContent.trim()
                }>
                Save
              </Button>
            </View>
          </View>
        ) : (
          <View style={styles.listContainer}>
            <Button
              mode="outlined"
              icon="plus"
              onPress={() => setShowAddForm(true)}
              style={styles.addButton}>
              New Prompt
            </Button>

            {prompts.length === 0 ? (
              <Text style={[styles.emptyText, {color: theme.colors.onSurfaceVariant}]}>
                No saved prompts yet. Tap "New Prompt" to add one.
              </Text>
            ) : (
              prompts.map(prompt => (
                <TouchableOpacity
                  key={prompt.id}
                  style={[styles.promptCard, {backgroundColor: theme.colors.surfaceVariant}]}
                  onPress={() => handleSelect(prompt)}
                  activeOpacity={0.7}>
                  <View style={styles.promptCardContent}>
                    <Text style={[styles.promptTitle, {color: theme.colors.onSurface}]} numberOfLines={1}>
                      {prompt.title}
                    </Text>
                    <Text style={[styles.promptSnippet, {color: theme.colors.onSurfaceVariant}]} numberOfLines={2}>
                      {prompt.content}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDelete(prompt)}
                    hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                    style={styles.deleteBtn}>
                    <Text style={[styles.deleteBtnText, {color: theme.colors.onSurfaceVariant}]}>✕</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </Sheet.ScrollView>
    </Sheet>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 8,
  },
  addButton: {
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 24,
  },
  promptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  promptCardContent: {
    flex: 1,
  },
  promptTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  promptSnippet: {
    fontSize: 12,
    lineHeight: 17,
  },
  deleteBtn: {
    paddingHorizontal: 4,
  },
  deleteBtnText: {
    fontSize: 14,
  },
  addForm: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  contentInput: {
    height: 140,
    paddingTop: 10,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
});
