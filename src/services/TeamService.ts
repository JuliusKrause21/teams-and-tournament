import { Db, WithId } from 'mongodb';
import { TeamEntity } from '../repositories/entities/TeamEntity';

export class TeamService {
  constructor(private readonly db: Db) {}

  public async listTeams(): Promise<WithId<TeamEntity>[]> {
    return this.db.collection<TeamEntity>('teams').find().toArray();
  }
}
