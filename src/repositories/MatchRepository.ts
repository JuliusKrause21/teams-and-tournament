import { InsertManyResult, WithId } from 'mongodb';
import { MatchEntity } from './entities/MatchEntity';
import { inject, injectable } from 'inversify';
import { Database } from '../Database';

export enum MatchRepositoryError {
  FailedToFindMatch = 'Could not find match in database',
  FindMatchFailed = 'Could not find match in database',
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

  public async bulkInsert(matchEntities: MatchEntity[]): Promise<InsertManyResult<MatchEntity>> {
    return this.matchCollection.insertMany(matchEntities);
  }
}
