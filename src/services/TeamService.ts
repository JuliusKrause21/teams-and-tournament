import { GameEntity, TeamEntity } from '../repositories/entities/TeamEntity';
import { bulkUpdate, TeamRepository } from '../repositories/TeamRepository';
import { inject, injectable } from 'inversify';
import { Group, Team, TeamQueryOptions } from '../models/Team';
import { MatchScheduleService } from './MatchScheduleService';
import { groupBy } from 'lodash';
import { Game, MatchPlan } from '../models/Game';
import { MatchDistributionService } from './MatchDistributionService';
import { MatchValidationService } from './MatchValidationService';
import { scheduleConfig } from '../dummyData';

export enum TeamServiceError {
  GroupingFailed = 'Could not get groups from database',
  ValidationFailed = 'Match plan validation failed',
}

export interface ShuffleParameters {
  numberOfGroups: number;
}

export interface MatchPlanParameters {
  numberOfPitches: number;
}

@injectable()
export class TeamService {
  constructor(
    @inject(TeamRepository) private readonly teamRepository: TeamRepository,
    @inject(MatchScheduleService) private readonly matchScheduleService: MatchScheduleService,
    @inject(MatchDistributionService) private readonly matchDistributionService: MatchDistributionService,
    @inject(MatchValidationService) private readonly matchValidationService: MatchValidationService
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
      throw new Error('Could not get teams from database');
    }

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

  public async generateMatchPlan(): Promise<MatchPlan> {
    console.log('Generate match plan');
    const groups = await this.teamRepository.groupByGroupNumber();

    if (groups.length === 0) {
      throw new Error(TeamServiceError.GroupingFailed);
    }

    const matchPlan = this.matchScheduleService.setupMatchPlan(
      groups.map((group) => ({ number: group.number, teams: group.teams.map(this.mapTeamEntityToTeam) }))
    );

    // TODO: Test the correct cause of the error on controller level
    const validation = this.matchValidationService.validateMatchPlan(matchPlan);
    if (validation.length > 0) {
      throw new Error(TeamServiceError.ValidationFailed, { cause: validation });
    }

    const homeGames = groups.flatMap((group) =>
      group.teams.flatMap((team) => matchPlan.filter((game) => game.team.teamId === team.team_id))
    );

    const groupedHomeGames = groupBy(homeGames, 'team.teamId');

    const teamsUpdateData: bulkUpdate[] = Object.entries(groupedHomeGames).map(([teamId, games]) => ({
      team_id: teamId,
      updateFields: { games: games.map(this.mapGameToGameEntity) },
    }));

    await this.teamRepository.bulkUpdate(teamsUpdateData);

    return matchPlan;
  }

  public async scheduleMatches(): Promise<MatchPlan> {
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
  }

  private mapGameToGameEntity(game: Game): GameEntity {
    return {
      game_id: game.gameId,
      start: game.start ?? '',
      location: game.location ?? '',
      opponent: game.opponent,
      number: game.number,
      group: game.group,
      slot: game.slot ?? 1,
      duration_in_minutes: game.durationInMinutes ?? 0,
      last_modified_at: new Date().toISOString(),
    };
  }

  private mapTeamEntityToTeam(teamEntity: TeamEntity): Team {
    return {
      teamId: teamEntity.team_id,
      group: teamEntity.group,
      name: teamEntity.name,
    };
  }
}
