import { inject, injectable } from 'inversify';
import { Database } from '../Database';
import { GameEntity } from './entities/GameEntity';
import { err, ok, Result } from 'neverthrow';

export enum GameRepositoryError {
  InsertAcknowledgeFailed = 'Insert games was not acknowledged',
  DeleteAcknowledgeFailed = 'Delete games was not acknowledged',
  InsertFailed = 'Could not insert games in db',
  UpdateFailed = 'Could not update game in db',
  DeleteFailed = 'Could not delete game from db',
  AggregationFailed = 'Could not aggregate games from db',
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

  public async wipeDatabase(): Promise<Result<undefined, Error>> {
    console.log(`Delete all games from database`);
    try {
      const result = await this.gameCollection.deleteMany();

      if (!result.acknowledged) {
        return err(new Error(GameRepositoryError.DeleteAcknowledgeFailed));
      }
      return ok(undefined);
    } catch (error) {
      return err(new Error(GameRepositoryError.DeleteFailed, { cause: error }));
    }
  }

  public async bulkInsert(gameEntities: GameEntity[]): Promise<Result<undefined, Error>> {
    console.log('Bulk insert games');
    try {
      const result = await this.gameCollection.insertMany(gameEntities);
      if (!result.acknowledged) {
        return err(new Error(GameRepositoryError.InsertAcknowledgeFailed));
      }
      return ok(undefined);
    } catch (error) {
      return err(new Error(GameRepositoryError.InsertFailed, { cause: error }));
    }
  }

  public async sortByGroupAndNumber(): Promise<Result<GameEntity[], Error>> {
    console.log('Sort games by group and number');
    try {
      const result = await this.gameCollection
        .aggregate<GameEntity>([{ $sort: { group: 1 } }, { $sort: { number: 1 } }])
        .toArray();
      return ok(result);
    } catch (error) {
      return err(new Error(GameRepositoryError.AggregationFailed, { cause: error }));
    }
  }

  public async bulkUpdate(bulkData: BulkUpdateGame[]): Promise<Result<undefined, Error>> {
    console.log('Bulk update games');
    try {
      const operations = bulkData.map((data) => ({
        updateOne: {
          filter: { game_id: data.game_id },
          update: { $set: data.updateFields },
        },
      }));

      await this.gameCollection.bulkWrite(operations);
      return ok(undefined);
    } catch (error) {
      return err(new Error(GameRepositoryError.UpdateFailed, { cause: error }));
    }
  }
}
