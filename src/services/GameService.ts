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

@injectable()
export class GameService {
  constructor(
    @inject(MatchDistributionService) private readonly matchDistributionService: MatchDistributionService,
    @inject(GameRepository) private readonly gameRepository: GameRepository,
    @inject(TeamRepository) private readonly teamRepository: TeamRepository
  ) {}

  public async createGames(): Promise<MatchPlan> {
    console.log('Create games');
    let groups = await this.teamRepository.groupByGroupNumber();

    const matchPlan = this.matchDistributionService.generateOptimizedMatchPlan(
      groups.map((group) => ({ number: group.number, teams: group.teams.map(mapTeamEntityToTeam) }))
    );

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

    // TODO: Check how atomic operation in mongo works
    // TODO: Error handling
    await this.replaceAllGames(matchPlan);
    await this.teamRepository.bulkUpdate(teamsUpdateData);

    return matchPlan;
  }

  public async scheduleGames(scheduleOptions: Partial<GameScheduleOptions>): Promise<MatchPlan> {
    console.log('Schedule games');
    let slot = 0;
    const numberOfPitches = scheduleOptions.numberOfPitches ?? 1;

    const gameEntities = await this.gameRepository.sortByGroupAndNumber();
    const teamEntities = await this.teamRepository.findAll();

    // TODO: Make nice error handling with neverthrow --> this is repository level error
    if (gameEntities.length === 0) {
      throw new Error('Could not find any games');
    }

    if (teamEntities.length === 0) {
      throw new Error('Could not find any teams');
    }

    const matchPlan = gameEntities.map((gameEntity) => this.mapGameEntityToGame(gameEntity, teamEntities));

    // TODO: This requires a valid match plan --> error handling
    const distributedMatchPlan = this.matchDistributionService.distributeMatchSlots(
      matchPlan,
      scheduleOptions.numberOfPitches
    );

    // TODO: Name of locations from input
    const scheduledMatchPlan = distributedMatchPlan.map((game, index) => {
      if (index > 0 && index % numberOfPitches === 0) {
        slot++;
      }
      return {
        ...game,
        schedule: {
          date: DateTime.fromISO(scheduleOptions.date ?? '').toISODate({ format: 'extended' }) ?? '',
          start:
            scheduleOptions.date === undefined ||
            scheduleOptions.playTimeInMinutes === undefined ||
            scheduleOptions.breakBetweenInMinutes === undefined
              ? ''
              : (DateTime.fromISO(scheduleOptions.date)
                  .plus({
                    minutes: slot * scheduleOptions.playTimeInMinutes + slot * scheduleOptions.breakBetweenInMinutes,
                  })
                  .toISOTime({ suppressMilliseconds: true, includeOffset: false }) ?? ''),
          durationInMinutes: scheduleOptions.playTimeInMinutes,
          location: scheduleOptions.location ?? 'First pitch',
        },
      };
    });

    await this.gameRepository.bulkUpdate(
      scheduledMatchPlan.map(this.mapGameToGameEntity).map((gameEntity) => ({
        game_id: gameEntity.game_id,
        updateFields: { schedule: gameEntity.schedule },
      }))
    );
    return scheduledMatchPlan;
  }

  // TODO: check atomic operation in mongo
  private async replaceAllGames(games: Game[]) {
    await this.gameRepository.wipeDatabase();
    await this.gameRepository.bulkInsert(games.map(this.mapGameToGameEntity));
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
