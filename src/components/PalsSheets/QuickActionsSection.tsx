import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {Switch} from 'react-native-paper';
import {v4 as uuidv4} from 'uuid';

import {useTheme} from '../../hooks';
import type {QuickAction} from '../../types/pal';

interface QuickActionsSectionProps {
  quickActions: QuickAction[];
  onChange: (actions: QuickAction[]) => void;
}

export const QuickActionsSection: React.FC<QuickActionsSectionProps> = ({
  quickActions,
  onChange,
}) => {
  const theme = useTheme();
  const [labelInput, setLabelInput] = useState('');
  const [promptInput, setPromptInput] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  const handleAdd = () => {
    const label = labelInput.trim();
    const prompt = promptInput.trim();
    if (!label || !prompt) {
      return;
    }
    onChange([...quickActions, {id: uuidv4(), label, prompt, enabled: true}]);
    setLabelInput('');
    setPromptInput('');
    setAddOpen(false);
  };

  const handleToggle = (id: string) => {
    onChange(
      quickActions.map(a => (a.id === id ? {...a, enabled: !a.enabled} : a)),
    );
  };

  const handleDelete = (id: string) => {
    onChange(quickActions.filter(a => a.id !== id));
  };

  const handleMove = (id: string, direction: 'up' | 'down') => {
    const idx = quickActions.findIndex(a => a.id === id);
    if (idx < 0) {
      return;
    }
    const next = direction === 'up' ? idx - 1 : idx + 1;
    if (next < 0 || next >= quickActions.length) {
      return;
    }
    const arr = [...quickActions];
    [arr[idx], arr[next]] = [arr[next], arr[idx]];
    onChange(arr);
  };

  return (
    <View>
      {quickActions.length === 0 && !addOpen && (
        <Text style={[styles.empty, {color: theme.colors.onSurfaceVariant}]}>
          No quick actions yet. Tap + to add one.
        </Text>
      )}

      {quickActions.map((action, idx) => (
        <View
          key={action.id}
          style={[
            styles.row,
            {borderBottomColor: theme.colors.surfaceVariant},
          ]}>
          <View style={styles.reorderBtns}>
            <TouchableOpacity
              onPress={() => handleMove(action.id, 'up')}
              disabled={idx === 0}
              style={styles.reorderBtn}>
              <Text
                style={[
                  styles.reorderText,
                  {color: theme.colors.onSurfaceVariant},
                  idx === 0 && styles.dimmed,
                ]}>
                ▲
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleMove(action.id, 'down')}
              disabled={idx === quickActions.length - 1}
              style={styles.reorderBtn}>
              <Text
                style={[
                  styles.reorderText,
                  {color: theme.colors.onSurfaceVariant},
                  idx === quickActions.length - 1 && styles.dimmed,
                ]}>
                ▼
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.rowContent}>
            <Text
              style={[styles.rowLabel, {color: theme.colors.onSurface}]}
              numberOfLines={1}>
              {action.label}
            </Text>
            <Text
              style={[styles.rowPrompt, {color: theme.colors.onSurfaceVariant}]}
              numberOfLines={2}>
              {action.prompt}
            </Text>
          </View>

          <Switch
            value={action.enabled}
            onValueChange={() => handleToggle(action.id)}
          />

          <TouchableOpacity
            onPress={() => handleDelete(action.id)}
            style={styles.deleteBtn}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Text style={[styles.deleteText, {color: theme.colors.error}]}>
              ✕
            </Text>
          </TouchableOpacity>
        </View>
      ))}

      {addOpen ? (
        <View
          style={[
            styles.addForm,
            {backgroundColor: theme.colors.surfaceVariant},
          ]}>
          <TextInput
            style={[
              styles.input,
              {
                color: theme.colors.onSurface,
                borderColor: theme.colors.outline,
                backgroundColor: theme.colors.surface,
              },
            ]}
            placeholder="Label (e.g. Get News)"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={labelInput}
            onChangeText={setLabelInput}
            maxLength={30}
          />
          <TextInput
            style={[
              styles.input,
              styles.promptInput,
              {
                color: theme.colors.onSurface,
                borderColor: theme.colors.outline,
                backgroundColor: theme.colors.surface,
              },
            ]}
            placeholder="Prompt text…"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={promptInput}
            onChangeText={setPromptInput}
            multiline
            maxLength={500}
          />
          <View style={styles.addActions}>
            <TouchableOpacity onPress={() => setAddOpen(false)}>
              <Text style={{color: theme.colors.onSurfaceVariant}}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAdd}
              style={[
                styles.saveBtn,
                {backgroundColor: theme.colors.primary},
              ]}>
              <Text style={{color: theme.colors.onPrimary, fontWeight: '600'}}>
                Save
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => setAddOpen(true)}
          style={styles.addRow}>
          <Text style={[styles.addLabel, {color: theme.colors.primary}]}>
            + Add quick action
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  empty: {
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  reorderBtns: {
    flexDirection: 'column',
    gap: 2,
  },
  reorderBtn: {
    padding: 2,
  },
  reorderText: {
    fontSize: 10,
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  rowPrompt: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  deleteBtn: {
    paddingHorizontal: 4,
  },
  deleteText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dimmed: {
    opacity: 0.3,
  },
  addForm: {
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    marginBottom: 8,
  },
  promptInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  addActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
  },
  saveBtn: {
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  addRow: {
    paddingVertical: 10,
  },
  addLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
});
