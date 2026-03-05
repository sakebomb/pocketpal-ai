import React, {useMemo} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {Switch} from 'react-native-paper';

import {TOOL_CATALOG} from '../../utils/tools/catalog';
import type {PalCapabilities} from '../../types/pal';
import {useTheme} from '../../hooks';
import {SectionDivider} from './SectionDivider';

// Approximate tokens per tool definition (name + description + parameters schema)
const TOKENS_PER_TOOL = 150;
// Always-on tools (get_current_time + calculate) always injected
const BASE_TOOL_TOKENS = 2 * TOKENS_PER_TOOL;

interface ToolsPickerProps {
  capabilities: PalCapabilities;
  onToggle: (key: keyof PalCapabilities) => void;
  onBack: () => void;
}

const LIVE_TOOLS = TOOL_CATALOG.filter(t => t.category === 'live');
const REFERENCE_TOOLS = TOOL_CATALOG.filter(t => t.category === 'reference');
const UTILITY_TOOLS = TOOL_CATALOG.filter(t => t.category === 'utility');
const SEARCH_TOOLS = TOOL_CATALOG.filter(t => t.category === 'search');

export const ToolsPicker: React.FC<ToolsPickerProps> = ({
  capabilities,
  onToggle,
  onBack,
}) => {
  const theme = useTheme();
  const toolsEnabled = !!capabilities.tools;

  const enabledCount = useMemo(
    () => TOOL_CATALOG.filter(t => !!capabilities[t.capabilityKey]).length,
    [capabilities],
  );

  const estimatedTokens = BASE_TOOL_TOKENS + enabledCount * TOKENS_PER_TOOL;

  const budgetLevel: 'ok' | 'warn' | 'danger' =
    enabledCount <= 5 ? 'ok' : enabledCount <= 8 ? 'warn' : 'danger';

  const budgetColor =
    budgetLevel === 'ok'
      ? theme.colors.primary
      : budgetLevel === 'warn'
      ? '#F59E0B'
      : theme.colors.error;

  const budgetLabel =
    budgetLevel === 'ok'
      ? 'Good for 3B+ models'
      : budgetLevel === 'warn'
      ? 'Recommended for 7B+ models'
      : 'May fill context on small models';

  return (
    <View>
      <TouchableOpacity onPress={onBack} style={styles.backRow}>
        <Text style={[styles.backText, {color: theme.colors.primary}]}>
          ← Back
        </Text>
      </TouchableOpacity>

      {toolsEnabled && (
        <View
          style={[
            styles.budgetBanner,
            {
              backgroundColor: theme.colors.surfaceVariant,
              borderColor: budgetColor,
            },
          ]}>
          <Text style={[styles.budgetCount, {color: budgetColor}]}>
            {enabledCount} tools · ~{estimatedTokens} tokens/request
          </Text>
          <Text style={[styles.budgetHint, {color: theme.colors.onSurfaceVariant}]}>
            {budgetLabel}. Keep under 5 for 3B–7B models.
          </Text>
        </View>
      )}

      <ToolRow
        name="Enable Tool Use"
        description="Master switch — enables function calling. Requires a 3B+ model (Qwen2.5-3B, Llama-3.2-3B, Phi-3.5-mini or larger)."
        enabled={toolsEnabled}
        onToggle={() => onToggle('tools')}
      />

      <SectionDivider label="Live Data" />
      {LIVE_TOOLS.map(tool => (
        <ToolRow
          key={tool.capabilityKey}
          name={tool.name}
          description={
            tool.apiKeyHint
              ? `${tool.description}\n${tool.apiKeyHint}`
              : tool.description
          }
          enabled={!!capabilities[tool.capabilityKey]}
          onToggle={() => onToggle(tool.capabilityKey)}
          disabled={!toolsEnabled}
        />
      ))}

      <SectionDivider label="Reference" />
      {REFERENCE_TOOLS.map(tool => (
        <ToolRow
          key={tool.capabilityKey}
          name={tool.name}
          description={
            tool.apiKeyHint
              ? `${tool.description}\n${tool.apiKeyHint}`
              : tool.description
          }
          enabled={!!capabilities[tool.capabilityKey]}
          onToggle={() => onToggle(tool.capabilityKey)}
          disabled={!toolsEnabled}
        />
      ))}

      <SectionDivider label="Utilities" />
      {UTILITY_TOOLS.map(tool => (
        <ToolRow
          key={tool.capabilityKey}
          name={tool.name}
          description={tool.description}
          enabled={!!capabilities[tool.capabilityKey]}
          onToggle={() => onToggle(tool.capabilityKey)}
          disabled={!toolsEnabled}
        />
      ))}

      <SectionDivider label="Web Search — API Key Required" />
      {SEARCH_TOOLS.map(tool => (
        <ToolRow
          key={tool.capabilityKey}
          name={tool.name}
          description={
            tool.apiKeyHint
              ? `${tool.description}\n${tool.apiKeyHint}`
              : tool.description
          }
          enabled={!!capabilities[tool.capabilityKey]}
          onToggle={() => onToggle(tool.capabilityKey)}
          disabled={!toolsEnabled}
        />
      ))}
    </View>
  );
};

interface ToolRowProps {
  name: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

const ToolRow: React.FC<ToolRowProps> = ({
  name,
  description,
  enabled,
  onToggle,
  disabled,
}) => {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text
          style={[
            styles.rowName,
            {color: theme.colors.onSurface},
            disabled && styles.dimmed,
          ]}>
          {name}
        </Text>
        <Text
          style={[
            styles.rowDesc,
            {color: theme.colors.onSurfaceVariant},
            disabled && styles.dimmed,
          ]}>
          {description}
        </Text>
      </View>
      <Switch
        value={enabled && !disabled}
        onValueChange={disabled ? undefined : onToggle}
        disabled={disabled}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  backRow: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  backText: {
    fontSize: 15,
    fontWeight: '500',
  },
  budgetBanner: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  budgetCount: {
    fontSize: 13,
    fontWeight: '600',
  },
  budgetHint: {
    fontSize: 12,
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  rowText: {
    flex: 1,
    paddingRight: 12,
  },
  rowName: {
    fontSize: 14,
    fontWeight: '500',
  },
  rowDesc: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 17,
  },
  dimmed: {
    opacity: 0.4,
  },
});
