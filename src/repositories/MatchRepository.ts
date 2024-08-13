import { InsertManyResult, WithId } from 'mongodb';
import { MatchEntity } from './entities/MatchEntity';
import { inject, injectable } from 'inversify';
import { Database } from '../Database';

@injectable()
export class MatchRepository {
  constructor(@inject(Database) private readonly db: Database) {
    this.matchCollection = this.db.getCollection<MatchEntity>('matches');
  }

  private matchCollection;

  public async findAll(): Promise<WithId<MatchEntity>[]> {
    return this.matchCollection.find().toArray();
  }

  public async bulkInsert(matchEntities: MatchEntity[]): Promise<InsertManyResult<MatchEntity>> {
    return this.matchCollection.insertMany(matchEntities);
  }
}
