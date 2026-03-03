import {Model} from '@nozbe/watermelondb';
import {field, readonly, date} from '@nozbe/watermelondb/decorators';

export class Memory extends Model {
  static table = 'memories';

  @field('pal_id') palId!: string;
  @field('content') content!: string;
  @readonly @date('created_at') createdAt!: Date;
}
