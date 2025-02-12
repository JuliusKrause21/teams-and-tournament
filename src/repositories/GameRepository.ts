import { inject, injectable } from 'inversify';
import { Database } from '../Database';
import { GameEntity } from './entities/GameEntity';

export enum GameRepositoryError {
  InsertAcknowledgeFailed = 'Insert games was not acknowledged',
  DeleteAcknowledgeFailed = 'Delete games was not acknowledged',
}

// TODO: Make generic interface for Team and Game
export interface BulkUpdateGame {
  game_id: string | undefined;
  updateFields: Partial<GameEntity>;
}

@injectable()
export class GameRepository {
  constructor(@inject(Database) private readonly db: Database) {
    this.gameCollection = this.db.getCollection<GameEntity>('games');
  }

  private gameCollection;

  public async wipeDatabase(): Promise<void> {
    const result = await this.gameCollection.deleteMany();
    if (!result.acknowledged) {
      throw new Error(GameRepositoryError.DeleteAcknowledgeFailed);
    }
  }

  public async bulkInsert(gameEntities: GameEntity[]): Promise<void> {
    const result = await this.gameCollection.insertMany(gameEntities);
    if (!result.acknowledged) {
      throw new Error(GameRepositoryError.InsertAcknowledgeFailed);
    }
  }

  public sortByGroupAndNumber(): Promise<GameEntity[]> {
    return this.gameCollection.aggregate<GameEntity>([{ $sort: { group: 1 } }, { $sort: { number: 1 } }]).toArray();
  }

  public async bulkUpdate(bulkData: BulkUpdateGame[]): Promise<void> {
    console.log('Bulk update games');
    const operations = bulkData.map((data) => ({
      updateOne: {
        filter: { game_id: data.game_id },
        update: { $set: data.updateFields },
      },
    }));

    await this.gameCollection.bulkWrite(operations);
  }
}
