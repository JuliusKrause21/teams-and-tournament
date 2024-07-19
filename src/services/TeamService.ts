import { Db, WithId } from 'mongodb';
import { TeamEntity } from '../repositories/entities/TeamEntity';
import { TeamRepository } from '../repositories/TeamRepository';

export class TeamService {
  constructor(private readonly db: Db) {
    // This is the chain of calls where the db needs to passed from top level down to the repository
    // Use DI here with inversify to inject the repository to the service, the db to the repository ....
    this.teamRepository = new TeamRepository(this.db);
  }

  private teamRepository: TeamRepository;

  public async listTeams(): Promise<WithId<TeamEntity>[]> {
    /*
    This just returns the result of the repository call, but this is the place where the business logic is implemented
    Calls to several repositories, data combination and mapping takes place here.
     */
    return this.teamRepository.findAll();
  }
}
