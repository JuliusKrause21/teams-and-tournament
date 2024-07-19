import { WithId } from 'mongodb';
import { TeamEntity } from './entities/TeamEntity';
import { inject, injectable } from 'inversify';
import { Database } from '../Database';

@injectable()
export class TeamRepository {
  constructor(@inject(Database) private readonly db: Database) {
    this.teamsCollection = this.db.getCollection<TeamEntity>('teams');
  }

  private teamsCollection;

  public findAll(): Promise<WithId<TeamEntity>[]> {
    return this.teamsCollection.find().toArray();
  }
}
