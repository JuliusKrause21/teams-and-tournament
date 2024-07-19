import { Db, WithId } from 'mongodb';
import { TeamEntity } from './entities/TeamEntity';

export class TeamRepository {
  constructor(private readonly db: Db) {
    this.teamsCollection = this.db.collection<TeamEntity>('teams');
  }

  private teamsCollection;

  public findAll(): Promise<WithId<TeamEntity>[]> {
    return this.teamsCollection.find().toArray();
  }
}
