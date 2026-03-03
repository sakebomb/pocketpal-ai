import React, {useContext} from 'react';
import {View} from 'react-native';
import {observer} from 'mobx-react';
import {Text} from 'react-native-paper';

import {styles} from './styles';
import {chatSessionStore, modelStore, uiStore} from '../../store';
import {L10nContext} from '../../utils';

const formatTokens = (n: number): string =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

export const ChatHeaderTitle: React.FC = observer(() => {
  const l10n = useContext(L10nContext);
  const activeSessionId = chatSessionStore.activeSessionId;
  const activeSession = chatSessionStore.sessions.find(
    session => session.id === activeSessionId,
  );
  const activeModel = modelStore.activeModel;
  const promptTokens =
    uiStore.lastPromptTokensSessionId === activeSessionId
      ? uiStore.lastPromptTokens
      : null;
  const nCtx = modelStore.contextInitParams.n_ctx;
  const ctxLabel =
    promptTokens && nCtx
      ? `${formatTokens(promptTokens)} / ${formatTokens(nCtx)} ctx`
      : null;

  return (
    <View style={styles.container}>
      <Text numberOfLines={1} variant="titleSmall">
        {activeSession?.title || l10n.components.chatHeaderTitle.defaultTitle}
      </Text>
      {activeModel?.name && (
        <Text numberOfLines={1} variant="bodySmall">
          {activeModel?.name}
        </Text>
      )}
      {ctxLabel && (
        <Text numberOfLines={1} variant="labelSmall" style={styles.ctxLabel}>
          {ctxLabel}
        </Text>
      )}
    </View>
  );
});
