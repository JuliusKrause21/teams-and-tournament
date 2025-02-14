import { inject, injectable } from 'inversify';
import { GameService } from '../services/GameService';
import { Request, Response } from 'express';
import { GameScheduleOptions } from '../models/Game';

@injectable()
export class GameController {
  constructor(@inject(GameService) private readonly gameService: GameService) {}

  // TODO: update api.json to return correct error codes and messages --> only 500 at the moment
  public async generateScheduledMatchPlan(req: Request, res: Response): Promise<void> {
    console.log('Schedule matches of match plan');
    const result = await this.gameService.scheduleGames(req.body as Partial<GameScheduleOptions>);
    result.match(
      (matchPlan) => res.status(200).json(matchPlan),
      (error) => res.status(500).json(error)
    );
  }

  // TODO: update api.json to return correct error codes and messages --> only 500 at the moment
  public async generateInitialMatchPlan(_req: Request, res: Response): Promise<void> {
    console.log('Generate match plan');

    const result = await this.gameService.createGames();
    result.match(
      (matchPlan) => res.status(200).json(matchPlan),
      (error) => res.status(500).json(error)
    );
  }
}
