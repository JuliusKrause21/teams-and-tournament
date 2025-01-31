import { inject, injectable } from 'inversify';
import { Database } from '../Database';
import { GameEntity } from './entities/GameEntity';

export enum GameRepositoryError {
  InsertAcknowledgeFailed = 'Insert games was not acknowledged',
  DeleteAcknowledgeFailed = 'Delete games was not acknowledged',
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
}
