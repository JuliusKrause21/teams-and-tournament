import { inject, injectable } from 'inversify';
import { GameRepository } from '../repositories/GameRepository';
import { Game, GameScheduleOptions, MatchPlan } from '../models/Game';
import { GameEntity } from '../repositories/entities/GameEntity';
import { BulkUpdate, TeamRepository } from '../repositories/TeamRepository';
import { TeamEntity } from '../repositories/entities/TeamEntity';
import { MatchDistributionService } from './MatchDistributionService';
import { DateTime } from 'luxon';
import { groupBy } from 'lodash';
import { mapTeamEntityToTeam } from '../models/Team';
import { err, ok, Result } from 'neverthrow';
import combine = Result.combine;
import { MatchValidationService } from './MatchValidationService';

export enum GameServiceError {
  NoGamesFound = 'No games found in db',
  NoTeamsFound = 'No teams found in db',
  InvalidMatchPlan = 'Match plan validation failed',
  MatchPlanDistributionFailed = 'Match plan distribution failed',
}

@injectable()
export class GameService {
  constructor(
    @inject(MatchDistributionService) private readonly matchDistributionService: MatchDistributionService,
    @inject(MatchValidationService) private readonly matchValidationService: MatchValidationService,
    @inject(GameRepository) private readonly gameRepository: GameRepository,
    @inject(TeamRepository) private readonly teamRepository: TeamRepository
  ) {}

  public async createGames(): Promise<Result<MatchPlan, Error>> {
    console.log('Create games');
    let groups = await this.teamRepository.groupByGroupNumber();
    if (groups.isErr()) {
      return err(groups.error);
    }

    const matchPlan = this.matchDistributionService.generateOptimizedMatchPlan(
      groups.value.map((group) => ({ number: group.number, teams: group.teams.map(mapTeamEntityToTeam) }))
    );

    const validation = this.matchValidationService.validateMatchPlan(matchPlan);
    if (validation.length > 0) {
      return err(new Error(GameServiceError.InvalidMatchPlan, { cause: JSON.stringify(validation) }));
    }

    const games = groups.value.flatMap((group) =>
      group.teams.flatMap((team) =>
        matchPlan.filter((game) => game.team.teamId === team.team_id || game.opponent.teamId === team.team_id)
      )
    );

    const gameIdsPerTeam = groupBy(games, 'team.teamId');
    const teamsUpdateData: BulkUpdate[] = Object.entries(gameIdsPerTeam).map(([teamId, games]) => ({
      team_id: teamId,
      updateFields: { games: games.map((game) => game.gameId) },
    }));

    // TODO: Check how atomic operation in mongo works
    const result = combine([
      await this.replaceAllGames(matchPlan),
      await this.teamRepository.bulkUpdate(teamsUpdateData),
    ]);

    if (result.isErr()) {
      return err(result.error);
    }

    return ok(matchPlan);
  }

  public async scheduleGames(scheduleOptions: Partial<GameScheduleOptions>): Promise<Result<MatchPlan, Error>> {
    console.log('Schedule games');
    let slot = 0;
    const numberOfPitches = scheduleOptions.numberOfPitches ?? 1;

    const gameEntities = await this.gameRepository.sortByGroupAndNumber();
    if (gameEntities.isErr()) {
      return err(gameEntities.error);
    }
    const teamEntities = await this.teamRepository.findAll();
    if (teamEntities.isErr()) {
      return err(teamEntities.error);
    }

    if (gameEntities.value.length === 0) {
      return err(new Error(GameServiceError.NoGamesFound));
    }

    if (teamEntities.value.length === 0) {
      return err(new Error(GameServiceError.NoTeamsFound));
    }

    const matchPlan = gameEntities.value.map((gameEntity) => this.mapGameEntityToGame(gameEntity, teamEntities.value));

    try {
      const distributedMatchPlan = this.matchDistributionService.distributeMatchSlots(
        matchPlan,
        scheduleOptions.numberOfPitches
      );

      const validation = this.matchValidationService.validateMatchPlan(distributedMatchPlan);
      if (validation.length > 0) {
        return err(new Error(GameServiceError.InvalidMatchPlan, { cause: validation }));
      }

      // TODO: Name of locations from input --> separate method
      const scheduledMatchPlan = distributedMatchPlan.map((game, index) => {
        if (index > 0 && index % numberOfPitches === 0) {
          slot++;
        }
        return {
          ...game,
          schedule: {
            date:
              DateTime.fromISO(scheduleOptions.date ?? '')
                .toUTC()
                .toISODate({ format: 'extended' }) ?? '',
            start:
              scheduleOptions.date === undefined ||
              scheduleOptions.playTimeInMinutes === undefined ||
              scheduleOptions.breakBetweenInMinutes === undefined
                ? ''
                : (DateTime.fromISO(scheduleOptions.date)
                    .plus({
                      minutes: slot * scheduleOptions.playTimeInMinutes + slot * scheduleOptions.breakBetweenInMinutes,
                    })
                    .toUTC()
                    .toISOTime({ suppressMilliseconds: true, includeOffset: false }) ?? ''),
            durationInMinutes: scheduleOptions.playTimeInMinutes,
            location: scheduleOptions.location ?? 'First pitch',
          },
        };
      });

      const result = await this.gameRepository.bulkUpdate(
        scheduledMatchPlan.map(this.mapGameToGameEntity).map((gameEntity) => ({
          game_id: gameEntity.game_id,
          updateFields: { schedule: gameEntity.schedule },
        }))
      );
      if (result.isErr()) {
        return err(result.error);
      }
      return ok(scheduledMatchPlan);
    } catch (error) {
      return err(new Error(GameServiceError.MatchPlanDistributionFailed, { cause: error }));
    }
  }

  // TODO: check atomic operation in mongo
  private async replaceAllGames(games: Game[]): Promise<Result<undefined[], Error>> {
    return combine([
      await this.gameRepository.wipeDatabase(),
      await this.gameRepository.bulkInsert(games.map(this.mapGameToGameEntity)),
    ]);
  }

  private mapGameToGameEntity(game: Game): GameEntity {
    return {
      game_id: game.gameId,
      game_number: game.number,
      group: game.group,
      team: game.team.teamId ?? '',
      opponent: game.opponent.teamId ?? '',
      last_modified: new Date().toISOString(),
      slot: game.slot ?? 1,
      schedule: {
        date: game.schedule?.date ?? '',
        start: game.schedule?.start ?? '',
        location: game.schedule?.location ?? '',
        durationInMinutes: game.schedule?.durationInMinutes ?? 0,
      },
    };
  }

  // TODO: How to do error handling here
  private mapGameEntityToGame(gameEntity: GameEntity, teamEntities: TeamEntity[]): Game {
    const team = teamEntities.find((teamEntity) => teamEntity.team_id === gameEntity.team);
    const opponent = teamEntities.find((teamEntity) => teamEntity.team_id === gameEntity.opponent);

    if (team === undefined || opponent === undefined) {
      throw new Error('Could not map entities');
    }

    return {
      gameId: gameEntity.game_id,
      number: gameEntity.game_number,
      group: gameEntity.group,
      team: { teamId: team?.team_id ?? '', name: team?.name ?? '' },
      opponent: { teamId: opponent?.team_id ?? '', name: opponent?.name ?? '' },
    };
  }
}
