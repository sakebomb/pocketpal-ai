import React from 'react';
import {Text, ScrollView, TouchableOpacity, StyleSheet} from 'react-native';

import {useTheme} from '../../hooks';
import type {QuickAction} from '../../types/pal';

interface QuickActionsBarProps {
  quickActions: QuickAction[];
  onSelect: (prompt: string) => void;
}

export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  quickActions,
  onSelect,
}) => {
  const theme = useTheme();
  const visible = quickActions.filter(a => a.enabled);

  if (visible.length === 0) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.row}
      style={styles.container}>
      {visible.map(action => (
        <TouchableOpacity
          key={action.id}
          style={[
            styles.chip,
            {
              backgroundColor: theme.colors.surfaceVariant,
              borderColor: theme.colors.outline,
            },
          ]}
          onPress={() => onSelect(action.prompt)}
          activeOpacity={0.7}>
          <Text style={[styles.chipLabel, {color: theme.colors.onSurface}]}>
            {action.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 0,
  },
  row: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
});
