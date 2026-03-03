import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import * as RNFS from '@dr.pogodin/react-native-fs';
import {
  isErrorWithCode,
  pick,
  types,
  errorCodes,
} from '@react-native-documents/picker';
import {Button} from 'react-native-paper';

import type {DocumentInfo} from '../../repositories/DocumentRepository';
import {documentRepository} from '../../repositories/DocumentRepository';

const MAX_FILE_BYTES = 512 * 1024; // 512 KB

interface DocumentsSectionProps {
  palId: string;
}

export const DocumentsSection: React.FC<DocumentsSectionProps> = ({palId}) => {
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    try {
      const docs = await documentRepository.getDocumentsForPal(palId);
      setDocuments(docs);
    } catch (e) {
      console.error('Failed to load documents:', e);
    }
  }, [palId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleAddDocument = useCallback(async () => {
    try {
      setError(null);
      const res = await pick({
        type:
          Platform.OS === 'ios'
            ? ['public.plain-text', 'public.text']
            : [types.plainText, types.allFiles],
      });

      if (!res || res.length === 0) {
        return;
      }

      const file = res[0];
      const uri = file.uri;
      const name = file.name ?? 'document';

      // Basic extension check (allow .txt, .md, .csv, .json)
      const ext = name.split('.').pop()?.toLowerCase() ?? '';
      const supported = ['txt', 'md', 'csv', 'json', 'text', ''].includes(ext);
      if (!supported) {
        setError('Only plain text files (.txt, .md, .csv, .json) are supported.');
        return;
      }

      setLoading(true);

      // Check file size before reading
      const stat = await RNFS.stat(uri);
      if (stat.size > MAX_FILE_BYTES) {
        setError(
          `File is too large (${Math.round(stat.size / 1024)} KB). Maximum is 512 KB.`,
        );
        setLoading(false);
        return;
      }

      const text = await RNFS.readFile(uri, 'utf8');
      await documentRepository.addDocument(palId, name, text);
      await loadDocuments();
    } catch (err: any) {
      if (isErrorWithCode(err)) {
        if (err.code === errorCodes.OPERATION_CANCELED) {
          return; // user cancelled, no error
        }
      }
      console.error('Failed to add document:', err);
      setError('Failed to add document. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [palId, loadDocuments]);

  const handleDeleteDocument = useCallback(
    (doc: DocumentInfo) => {
      Alert.alert(
        'Remove Document',
        `Remove "${doc.name}" from this Pal's context?`,
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              try {
                await documentRepository.deleteDocument(doc.id);
                await loadDocuments();
              } catch (e) {
                console.error('Failed to delete document:', e);
              }
            },
          },
        ],
      );
    },
    [loadDocuments],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Documents</Text>
          <Text style={styles.subtitle}>
            Relevant chunks are injected into context when you chat
          </Text>
        </View>
        {loading ? (
          <ActivityIndicator size="small" style={styles.spinner} />
        ) : (
          <Button mode="outlined" compact onPress={handleAddDocument}>
            Add
          </Button>
        )}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {documents.length === 0 ? (
        <Text style={styles.emptyText}>No documents attached</Text>
      ) : (
        documents.map(doc => (
          <View key={doc.id} style={styles.docRow}>
            <Text style={styles.docName} numberOfLines={1}>
              {doc.name}
            </Text>
            <TouchableOpacity
              onPress={() => handleDeleteDocument(doc)}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Text style={styles.deleteButton}>✕</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 4,
    gap: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  spinner: {
    marginRight: 4,
  },
  emptyText: {
    fontSize: 12,
    color: '#aaa',
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#c00',
    paddingVertical: 4,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  docName: {
    flex: 1,
    fontSize: 13,
    color: '#333',
    marginRight: 12,
  },
  deleteButton: {
    fontSize: 14,
    color: '#888',
  },
});
