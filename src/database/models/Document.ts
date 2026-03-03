import {Model} from '@nozbe/watermelondb';
import {field, readonly, date} from '@nozbe/watermelondb/decorators';

export class Document extends Model {
  static table = 'documents';

  @field('pal_id') palId!: string;
  @field('name') name!: string;
  @readonly @date('created_at') createdAt!: Date;
}
