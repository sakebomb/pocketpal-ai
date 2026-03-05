import {database} from '../database';
import {Document} from '../database/models/Document';
import {DocumentChunk} from '../database/models/DocumentChunk';
import {Q} from '@nozbe/watermelondb';
import {chunkText, getRelevantChunks} from '../utils/documentChunker';

export interface DocumentInfo {
  id: string;
  name: string;
  createdAt: Date;
}

class DocumentRepository {
  private get docs() {
    return database.get<Document>('documents');
  }

  private get chunks() {
    return database.get<DocumentChunk>('document_chunks');
  }

  /**
   * Store a document and its chunks for a pal.
   */
  async addDocument(palId: string, name: string, text: string): Promise<void> {
    const MAX_DOC_SIZE = 1_000_000; // 1MB
    if (text.length > MAX_DOC_SIZE) {
      throw new Error(`Document too large (${(text.length / 1_000_000).toFixed(1)}MB). Maximum is 1MB.`);
    }
    const textChunks = chunkText(text);
    const now = Date.now();

    await database.write(async () => {
      const doc = await this.docs.create(record => {
        record.palId = palId;
        record.name = name;
      });

      for (let i = 0; i < textChunks.length; i++) {
        await this.chunks.create(record => {
          record.documentId = doc.id;
          record.palId = palId;
          record.content = textChunks[i];
          record.chunkIndex = i;
        });
      }
    });
  }

  /**
   * List documents attached to a pal.
   */
  async getDocumentsForPal(palId: string): Promise<DocumentInfo[]> {
    const records = await this.docs
      .query(Q.where('pal_id', palId))
      .fetch();
    return records
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map(r => ({id: r.id, name: r.name, createdAt: r.createdAt}));
  }

  /**
   * Delete a document and all its chunks.
   */
  async deleteDocument(docId: string): Promise<void> {
    await database.write(async () => {
      const docChunks = await this.chunks
        .query(Q.where('document_id', docId))
        .fetch();
      await Promise.all(docChunks.map(c => c.destroyPermanently()));

      try {
        const doc = await this.docs.find(docId);
        await doc.destroyPermanently();
      } catch {
        // Document already gone
      }
    });
  }

  /**
   * Retrieve the most relevant chunks for a pal given a query.
   */
  async getRelevantChunksForPal(
    palId: string,
    query: string,
    topK: number = 5,
  ): Promise<string[]> {
    const records = await this.chunks
      .query(Q.where('pal_id', palId), Q.sortBy('chunk_index', Q.asc))
      .fetch();

    const allChunks = records.map(r => r.content);
    return getRelevantChunks(allChunks, query, topK);
  }

  /**
   * Delete all documents and chunks for a pal.
   */
  async clearDocumentsForPal(palId: string): Promise<void> {
    await database.write(async () => {
      const allChunks = await this.chunks
        .query(Q.where('pal_id', palId))
        .fetch();
      await Promise.all(allChunks.map(c => c.destroyPermanently()));

      const allDocs = await this.docs
        .query(Q.where('pal_id', palId))
        .fetch();
      await Promise.all(allDocs.map(d => d.destroyPermanently()));
    });
  }
}

export const documentRepository = new DocumentRepository();
