import {database} from '../database';
import {GenerationPreset} from '../database/models/GenerationPreset';

export interface PresetSettings {
  temperature: number;
  top_p: number;
  n_predict: number;
}

export interface PresetInfo {
  id: string;
  name: string;
  settings: PresetSettings;
  builtIn: boolean;
  createdAt?: Date;
}

export const BUILT_IN_PRESETS: PresetInfo[] = [
  {
    id: '__precise__',
    name: 'Precise',
    settings: {temperature: 0.2, top_p: 0.9, n_predict: 1024},
    builtIn: true,
  },
  {
    id: '__balanced__',
    name: 'Balanced',
    settings: {temperature: 0.7, top_p: 0.95, n_predict: 1024},
    builtIn: true,
  },
  {
    id: '__creative__',
    name: 'Creative',
    settings: {temperature: 1.2, top_p: 0.98, n_predict: 2048},
    builtIn: true,
  },
];

class PresetRepository {
  private get collection() {
    return database.get<GenerationPreset>('generation_presets');
  }

  async getAllPresets(): Promise<PresetInfo[]> {
    const records = await this.collection.query().fetch();
    const custom: PresetInfo[] = records
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map(r => ({
        id: r.id,
        name: r.name,
        settings: JSON.parse(r.settingsJson) as PresetSettings,
        builtIn: false,
        createdAt: r.createdAt,
      }));
    return [...BUILT_IN_PRESETS, ...custom];
  }

  async addPreset(name: string, settings: PresetSettings): Promise<void> {
    await database.write(async () => {
      await this.collection.create(record => {
        record.name = name;
        record.settingsJson = JSON.stringify(settings);
      });
    });
  }

  async deletePreset(id: string): Promise<void> {
    await database.write(async () => {
      try {
        const record = await this.collection.find(id);
        await record.destroyPermanently();
      } catch {
        // Already gone
      }
    });
  }
}

export const presetRepository = new PresetRepository();
