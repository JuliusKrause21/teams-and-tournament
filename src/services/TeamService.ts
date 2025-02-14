import { TeamEntity } from '../repositories/entities/TeamEntity';
import { BulkUpdate, TeamRepository } from '../repositories/TeamRepository';
import { inject, injectable } from 'inversify';
import { Group, mapTeamEntityToTeam, Team, TeamQueryOptions } from '../models/Team';
import { shuffle } from 'lodash';
import { err, ok, Result } from 'neverthrow';

export enum TeamServiceError {
  NoTeamsFound = 'Could not get teams from database',
}

export interface ShuffleParameters {
  numberOfGroups: number;
}

@injectable()
export class TeamService {
  constructor(@inject(TeamRepository) private readonly teamRepository: TeamRepository) {}

  public async listTeams(query?: TeamQueryOptions): Promise<Result<Team[], Error>> {
    /*
    This just returns the result of the repository call, but this is the place where the business logic is implemented
    Calls to several repositories, data combination and mapping takes place here.
     */
    const teamEntities = await this.teamRepository.findAll(query);
    if (teamEntities.isErr()) {
      return err(teamEntities.error);
    }
    return ok(teamEntities.value.map(mapTeamEntityToTeam));
  }

  // TODO: Accept team model and map to team entity within service
  public async createTeam(teamEntity: TeamEntity): Promise<Result<undefined, Error>> {
    return this.teamRepository.insert(teamEntity);
  }

  public async shuffleGroups({ numberOfGroups }: ShuffleParameters): Promise<Result<Group[], Error>> {
    console.log('Shuffle teams into groups');
    const groups: Group[] = [];
    const teamEntities = await this.teamRepository.findAll();
    if (teamEntities.isErr()) {
      return err(teamEntities.error);
    }
    if (teamEntities.value.length === 0) {
      return err(new Error(TeamServiceError.NoTeamsFound));
    }
    const shuffledTeamEntities = shuffle(teamEntities.value);
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

    const updateResult = await this.teamRepository.bulkUpdate(teamsUpdateData);
    if (updateResult.isErr()) {
      return err(updateResult.error);
    }
    return ok(groups);
  }
}
