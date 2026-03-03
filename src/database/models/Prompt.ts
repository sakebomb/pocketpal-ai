import {Model} from '@nozbe/watermelondb';
import {field, readonly, date} from '@nozbe/watermelondb/decorators';

export class Prompt extends Model {
  static table = 'prompts';

  @field('title') title!: string;
  @field('content') content!: string;
  @readonly @date('created_at') createdAt!: Date;
}
