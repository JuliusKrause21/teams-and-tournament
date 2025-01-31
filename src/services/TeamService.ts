import { TeamEntity } from '../repositories/entities/TeamEntity';
import { BulkUpdate, TeamRepository } from '../repositories/TeamRepository';
import { inject, injectable } from 'inversify';
import { Group, Team, TeamQueryOptions } from '../models/Team';
import { groupBy, shuffle } from 'lodash';
import { MatchPlan } from '../models/Game';
import { MatchDistributionService } from './MatchDistributionService';
import { GameService } from './GameService';

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
  constructor(
    @inject(TeamRepository) private readonly teamRepository: TeamRepository,
    @inject(GameService) private readonly gameService: GameService,
    @inject(MatchDistributionService) private readonly matchDistributionService: MatchDistributionService
  ) {}

  public async listTeams(query?: TeamQueryOptions): Promise<Team[]> {
    /*
    This just returns the result of the repository call, but this is the place where the business logic is implemented
    Calls to several repositories, data combination and mapping takes place here.
     */
    const teamEntities = await this.teamRepository.findAll(query);
    return teamEntities.map(this.mapTeamEntityToTeam);
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

  public async generateMatchPlan(): Promise<MatchPlan> {
    console.log('Generate match plan');
    let groups = await this.teamRepository.groupByGroupNumber();

    if (groups.length === 0) {
      groups = await this.shuffleGroups({ numberOfGroups: 1 });
    }

    const matchPlan = this.matchDistributionService.generateOptimizedMatchPlan(
      groups.map((group) => ({ number: group.number, teams: group.teams.map(this.mapTeamEntityToTeam) }))
    );

    await this.gameService.replaceAllGames(matchPlan);
    // TODO: Save game ids to participating team

    const games = groups.flatMap((group) =>
      group.teams.flatMap((team) =>
        matchPlan.filter((game) => game.team.teamId === team.team_id || game.opponent.teamId === team.team_id)
      )
    );

    const gameIdsPerTeam = groupBy(games, 'team.teamId');
    const teamsUpdateData: BulkUpdate[] = Object.entries(gameIdsPerTeam).map(([teamId, games]) => ({
      team_id: teamId,
      updateFields: { games: games.map((game) => game.gameId) },
    }));

    await this.teamRepository.bulkUpdate(teamsUpdateData);

    return matchPlan;
  }

  // TODO: Move to GameService
  /*public async scheduleMatches(): Promise<MatchPlan> {
    const teamEntities = await this.teamRepository.sortBySlotAndNumber();
    const matchPlan: MatchPlan = teamEntities.flatMap((teamEntity) =>
      (teamEntity.games ?? []).map((game) => ({
        gameId: game.game_id,
        location: game.location,
        number: game.number,
        group: game.group ?? 1,
        team: { teamId: teamEntity.team_id, name: teamEntity.name },
        opponent: game.opponent,
      }))
    );

    if (matchPlan.length === 0) {
      return matchPlan;
    }

    const distributedMatchPlan = this.matchDistributionService.distributeMatchSlots(
      matchPlan,
      scheduleConfig.numberOfPitches
    );
    return this.matchScheduleService.scheduleMatches(distributedMatchPlan);
  }*/

  private mapTeamEntityToTeam(teamEntity: TeamEntity): Team {
    return {
      teamId: teamEntity.team_id,
      group: teamEntity.group,
      name: teamEntity.name,
    };
  }
}
