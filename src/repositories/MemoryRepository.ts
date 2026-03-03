import {database} from '../database';
import {Memory} from '../database/models/Memory';
import {Q} from '@nozbe/watermelondb';

class MemoryRepository {
  private get collection() {
    return database.get<Memory>('memories');
  }

  async getMemoriesForPal(palId: string): Promise<string[]> {
    const records = await this.collection
      .query(Q.where('pal_id', palId))
      .fetch();
    // Sort by created_at ascending (oldest first)
    return records
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map(r => r.content);
  }

  async addMemory(palId: string, content: string): Promise<void> {
    await database.write(async () => {
      await this.collection.create(record => {
        record.palId = palId;
        record.content = content;
      });
    });
  }

  async clearMemoriesForPal(palId: string): Promise<void> {
    await database.write(async () => {
      const records = await this.collection
        .query(Q.where('pal_id', palId))
        .fetch();
      await Promise.all(records.map(r => r.destroyPermanently()));
    });
  }
}

export const memoryRepository = new MemoryRepository();
