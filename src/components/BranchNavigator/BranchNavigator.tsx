import React from 'react';
import {View, TouchableOpacity, StyleSheet} from 'react-native';
import {Text} from 'react-native-paper';

import {chatSessionStore} from '../../store';
import {useTheme} from '../../hooks';

interface BranchNavigatorProps {
  branchGroupId: string;
  currentIndex: number;
  totalBranches: number;
}

export const BranchNavigator: React.FC<BranchNavigatorProps> = ({
  branchGroupId,
  currentIndex,
  totalBranches,
}) => {
  const theme = useTheme();

  const onPrev = () => chatSessionStore.navigateBranch(branchGroupId, 'prev');
  const onNext = () => chatSessionStore.navigateBranch(branchGroupId, 'next');

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onPrev}
        disabled={currentIndex === 0}
        hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
        style={[styles.arrow, currentIndex === 0 && styles.disabled]}>
        <Text style={[styles.arrowText, {color: theme.colors.primary}]}>‹</Text>
      </TouchableOpacity>
      <Text style={[styles.label, {color: theme.colors.onSurfaceVariant}]}>
        {currentIndex + 1} / {totalBranches}
      </Text>
      <TouchableOpacity
        onPress={onNext}
        disabled={currentIndex === totalBranches - 1}
        hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
        style={[
          styles.arrow,
          currentIndex === totalBranches - 1 && styles.disabled,
        ]}>
        <Text style={[styles.arrowText, {color: theme.colors.primary}]}>›</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginLeft: 12,
    marginBottom: 4,
    gap: 6,
  },
  arrow: {
    paddingHorizontal: 4,
  },
  disabled: {
    opacity: 0.3,
  },
  arrowText: {
    fontSize: 20,
    lineHeight: 22,
  },
  label: {
    fontSize: 12,
    minWidth: 32,
    textAlign: 'center',
  },
});
