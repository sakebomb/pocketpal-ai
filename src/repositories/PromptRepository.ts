import {database} from '../database';
import {Prompt} from '../database/models/Prompt';
import {Q} from '@nozbe/watermelondb';

export interface PromptInfo {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}

class PromptRepository {
  private get collection() {
    return database.get<Prompt>('prompts');
  }

  async getAllPrompts(): Promise<PromptInfo[]> {
    const records = await this.collection.query().fetch();
    return records
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map(r => ({id: r.id, title: r.title, content: r.content, createdAt: r.createdAt}));
  }

  async addPrompt(title: string, content: string): Promise<void> {
    await database.write(async () => {
      await this.collection.create(record => {
        record.title = title;
        record.content = content;
      });
    });
  }

  async deletePrompt(id: string): Promise<void> {
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

export const promptRepository = new PromptRepository();
