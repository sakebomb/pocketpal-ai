import {Model} from '@nozbe/watermelondb';
import {field, readonly, date} from '@nozbe/watermelondb/decorators';

export class GenerationPreset extends Model {
  static table = 'generation_presets';

  @field('name') name!: string;
  @field('settings_json') settingsJson!: string;
  @readonly @date('created_at') createdAt!: Date;
}
