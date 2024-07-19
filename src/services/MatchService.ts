import { Db, WithId } from 'mongodb';
import { MatchEntity } from '../repositories/entities/MatchEntity';

export class MatchService {
  constructor(private readonly db: Db) {}

  public listMatches(): Promise<WithId<MatchEntity>[]> {
    return this.db.collection<MatchEntity>('matches').find().toArray();
  }
}
