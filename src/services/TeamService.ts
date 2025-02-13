import { TeamEntity } from '../repositories/entities/TeamEntity';
import { BulkUpdate, TeamRepository } from '../repositories/TeamRepository';
import { inject, injectable } from 'inversify';
import { Group, mapTeamEntityToTeam, Team, TeamQueryOptions } from '../models/Team';
import { shuffle } from 'lodash';

export enum TeamServiceError {
  NoTeamsFound = 'Could not get teams from database',
  GroupingFailed = 'Could not get groups from database',
  ValidationFailed = 'Match plan validation failed',
}

export interface ShuffleParameters {
  numberOfGroups: number;
}

@injectable()
export class TeamService {
  constructor(@inject(TeamRepository) private readonly teamRepository: TeamRepository) {}

  public async listTeams(query?: TeamQueryOptions): Promise<Team[]> {
    /*
    This just returns the result of the repository call, but this is the place where the business logic is implemented
    Calls to several repositories, data combination and mapping takes place here.
     */
    const teamEntities = await this.teamRepository.findAll(query);
    return teamEntities.map(mapTeamEntityToTeam);
  }

  public async createTeam(teamEntity: TeamEntity): Promise<void> {
    await this.teamRepository.insert(teamEntity);
  }

  public async shuffleGroups({ numberOfGroups }: ShuffleParameters): Promise<Group[]> {
    console.log('Shuffle teams into groups');
    const groups: Group[] = [];
    const teamEntities = await this.teamRepository.findAll();

    if (!teamEntities || teamEntities.length === 0) {
      throw new Error(TeamServiceError.NoTeamsFound);
    }
    const shuffledTeamEntities = shuffle(teamEntities);
    const sliceAt = Math.ceil(shuffledTeamEntities.length / numberOfGroups);
    for (let i = 0; i < numberOfGroups; i++) {
      groups.push({
        number: i + 1,
        teams: shuffledTeamEntities
          .slice(i * sliceAt, (i + 1) * sliceAt)
          .map((teamEntity) => ({ teamId: teamEntity.team_id, name: teamEntity.name })),
      });
    }

    const teamsUpdateData: BulkUpdate[] = groups.flatMap((group) =>
      group.teams.map((team) => ({
        team_id: team.teamId,
        updateFields: { group: group.number },
      }))
    );

    await this.teamRepository.bulkUpdate(teamsUpdateData);
    return groups;
  }
}
