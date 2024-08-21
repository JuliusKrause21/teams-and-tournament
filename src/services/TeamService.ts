import { TeamEntity } from '../repositories/entities/TeamEntity';
import { bulkUpdate, TeamRepository } from '../repositories/TeamRepository';
import { inject, injectable } from 'inversify';
import { Group, Team } from '../models/Team';

export interface ShuffleParameters {
  numberOfGroups: number;
}

@injectable()
export class TeamService {
  constructor(@inject(TeamRepository) private readonly teamRepository: TeamRepository) {}

  public async listTeams(): Promise<Team[]> {
    /*
    This just returns the result of the repository call, but this is the place where the business logic is implemented
    Calls to several repositories, data combination and mapping takes place here.
     */
    const teamEntities = await this.teamRepository.findAll();
    return teamEntities.map(this.mapTeamEntityToTeam);
  }

  public async createTeam(teamEntity: TeamEntity): Promise<void> {
    await this.teamRepository.insert(teamEntity);
  }

  public async shuffleGroups({ numberOfGroups }: ShuffleParameters): Promise<Group[]> {
    console.log('Shuffle teams into groups');
    const groups: Group[] = [];
    const teamEntities = await this.teamRepository.findAll();
    const sliceAt = Math.ceil(teamEntities.length / numberOfGroups);

    for (let i = 0; i < numberOfGroups; i++) {
      groups.push({
        number: i + 1,
        teams: teamEntities
          .slice(i * sliceAt, (i + 1) * sliceAt)
          .map((teamEntity) => ({ teamId: teamEntity.team_id, name: teamEntity.name })),
      });
    }

    const teamsUpdateData: bulkUpdate[] = groups.flatMap((group) =>
      group.teams.map((team) => ({
        team_id: team.teamId,
        updateFields: { group: group.number },
      }))
    );

    await this.teamRepository.bulkUpdate(teamsUpdateData);

    return groups;
  }

  private mapTeamEntityToTeam(teamEntity: TeamEntity): Team {
    return {
      teamId: teamEntity.team_id,
      group: teamEntity.group,
      name: teamEntity.name,
    };
  }
}
