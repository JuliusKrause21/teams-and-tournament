import { WithId } from 'mongodb';
import { TeamEntity } from '../repositories/entities/TeamEntity';
import { TeamRepository } from '../repositories/TeamRepository';
import { inject, injectable } from 'inversify';

@injectable()
export class TeamService {
  constructor(@inject(TeamRepository) private readonly teamRepository: TeamRepository) {}

  public async listTeams(): Promise<WithId<TeamEntity>[]> {
    /*
    This just returns the result of the repository call, but this is the place where the business logic is implemented
    Calls to several repositories, data combination and mapping takes place here.
     */
    return this.teamRepository.findAll();
  }

  public async createTeam(teamEntity: TeamEntity): Promise<void> {
    await this.teamRepository.insert(teamEntity);
  }
}
