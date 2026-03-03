import {Model} from '@nozbe/watermelondb';
import {field, readonly, date} from '@nozbe/watermelondb/decorators';

export class DocumentChunk extends Model {
  static table = 'document_chunks';

  @field('document_id') documentId!: string;
  @field('pal_id') palId!: string;
  @field('content') content!: string;
  @field('chunk_index') chunkIndex!: number;
  @readonly @date('created_at') createdAt!: Date;
}
