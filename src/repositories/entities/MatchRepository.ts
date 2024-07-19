import { Db, WithId } from 'mongodb';
import { MatchEntity } from './MatchEntity';

export class MatchRepository {
  constructor(private readonly db: Db) {
    this.matchCollection = this.db.collection<MatchEntity>('matches');
  }

  private matchCollection;

  public async findAll(): Promise<WithId<MatchEntity>[]> {
    return this.matchCollection.find().toArray();
  }
}
