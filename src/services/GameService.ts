import { inject, injectable } from 'inversify';
import { GameRepository } from '../repositories/GameRepository';
import { Game } from '../models/Game';
import { GameEntity } from '../repositories/entities/GameEntity';

@injectable()
export class GameService {
  constructor(@inject(GameRepository) private readonly gameRepository: GameRepository) {}

  public async replaceAllGames(games: Game[]) {
    await this.gameRepository.wipeDatabase();
    await this.gameRepository.bulkInsert(games.map(this.mapGameToGameEntity));
  }

  private mapGameToGameEntity(game: Game): GameEntity {
    return {
      game_id: game.gameId,
      game_number: game.number,
      group: game.group,
      home_team: game.team.teamId ?? '',
      away_team: game.opponent.teamId ?? '',
      created: '1235',
      last_modified: new Date().toISOString(),
      schedule: {
        slot: game.slot ?? 1,
        start: game.start ?? '',
        location: game.location ?? '',
        durationInMinutes: game.durationInMinutes ?? 0,
      },
    };
  }
}
