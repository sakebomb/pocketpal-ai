import React, {useCallback, useState} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import WebView, {WebViewNavigation} from 'react-native-webview';

import {CloseIcon} from '../../assets/icons';
import {useTheme} from '../../hooks';

interface ArtifactModalProps {
  isVisible: boolean;
  content: string;
  language: string;
  onClose: () => void;
}

const RENDERABLE_LANGS = new Set(['html', 'htm', 'svg', 'xml']);

export const isRenderableLanguage = (language: string): boolean => {
  return RENDERABLE_LANGS.has(language.toLowerCase());
};

export const isRenderableContent = (
  content: string,
  language: string,
): boolean => {
  if (isRenderableLanguage(language)) {
    return true;
  }
  // Auto-detect bare HTML/SVG when no language is set
  if (!language || language === 'text') {
    const trimmed = content.trimStart();
    return (
      trimmed.startsWith('<!DOCTYPE') ||
      trimmed.startsWith('<html') ||
      trimmed.startsWith('<svg')
    );
  }
  return false;
};

const CSP =
  '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; img-src data: blob:; font-src data:;">';

const prepareHtml = (content: string, language: string): string => {
  if (language === 'svg') {
    return `<!DOCTYPE html><html><head>${CSP}<meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#fff}</style></head><body>${content}</body></html>`;
  }
  const trimmed = content.trimStart();
  if (
    trimmed.startsWith('<!DOCTYPE') ||
    trimmed.startsWith('<html') ||
    trimmed.startsWith('<HTML')
  ) {
    // Inject CSP into existing HTML
    const headEnd = content.indexOf('</head>');
    if (headEnd !== -1) {
      return content.slice(0, headEnd) + CSP + content.slice(headEnd);
    }
    return content;
  }
  return `<!DOCTYPE html><html><head>${CSP}<meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${content}</body></html>`;
};

export const ArtifactModal: React.FC<ArtifactModalProps> = ({
  isVisible,
  content,
  language,
  onClose,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, insets);

  const htmlSource = prepareHtml(content, language);
  const title = language ? language.toUpperCase() : 'Artifact';
  const needsJs = language !== 'svg' && language !== 'xml';
  const [webViewError, setWebViewError] = useState<string | null>(null);

  const handleNavigationRequest = useCallback(
    (event: WebViewNavigation) => {
      // Only allow the initial about:blank load
      if (event.url === 'about:blank') {
        return true;
      }
      return false;
    },
    [],
  );

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <CloseIcon
              width={20}
              height={20}
              stroke={theme.colors.onSurface}
            />
          </TouchableOpacity>
        </View>
        {webViewError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Failed to render artifact: {webViewError}
            </Text>
          </View>
        ) : (
          <WebView
            style={styles.webview}
            source={{html: htmlSource}}
            originWhitelist={['about:blank']}
            javaScriptEnabled={needsJs}
            allowFileAccess={false}
            allowUniversalAccessFromFileURLs={false}
            mixedContentMode="never"
            setSupportMultipleWindows={false}
            onShouldStartLoadWithRequest={handleNavigationRequest}
            onError={syntheticEvent => {
              setWebViewError(syntheticEvent.nativeEvent.description);
            }}
          />
        )}
      </View>
    </Modal>
  );
};

const createStyles = (theme: any, insets: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingTop: Platform.OS === 'android' ? insets.top : 0,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.outlineVariant,
    },
    title: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onSurface,
      flex: 1,
    },
    closeButton: {
      padding: 8,
      marginLeft: 8,
    },
    webview: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    errorText: {
      color: theme.colors.error,
      fontSize: 14,
      textAlign: 'center',
    },
  });
