import { UpdateFilter } from 'mongodb';
import { MatchEntity } from './entities/MatchEntity';
import { inject, injectable } from 'inversify';
import { Database } from '../Database';

export enum MatchRepositoryError {
  FindMatchFailed = 'Could not find match in database',
  UpdateAcknowledgeFailed = 'Update match was not acknowledged',
  UpdateMatchFailed = 'Update match failed',
  InsertAcknowledgeFailed = 'Insert was not acknowledged',
}

@injectable()
export class MatchRepository {
  constructor(@inject(Database) private readonly db: Database) {
    this.matchCollection = this.db.getCollection<MatchEntity>('matches');
  }

  private matchCollection;

  public async findAll(): Promise<MatchEntity[]> {
    return this.matchCollection.find({}, { projection: { _id: 0 } }).toArray();
  }

  public async findById(match_id: string): Promise<MatchEntity> {
    const matchEntity = await this.matchCollection.findOne({ match_id }, { projection: { id: 0 } });
    if (matchEntity === null) {
      throw new Error(MatchRepositoryError.FindMatchFailed);
    }
    return matchEntity;
  }

  public async bulkInsert(matchEntities: MatchEntity[]): Promise<void> {
    const result = await this.matchCollection.insertMany(matchEntities);
    if (!result.acknowledged) {
      throw new Error(MatchRepositoryError.InsertAcknowledgeFailed);
    }
  }

  public async updateOne(match_id: string, updateFields: UpdateFilter<MatchEntity>): Promise<void> {
    const updateResult = await this.matchCollection.updateOne({ match_id }, { $set: updateFields });

    if (!updateResult.acknowledged) {
      throw new Error(MatchRepositoryError.UpdateAcknowledgeFailed);
    }
    if (updateResult.matchedCount === 0) {
      throw new Error(MatchRepositoryError.FindMatchFailed);
    }
    if (updateResult.modifiedCount === 0) {
      throw new Error(MatchRepositoryError.UpdateMatchFailed);
    }
  }
}
