import { inject, injectable } from 'inversify';
import { GameService } from '../services/GameService';
import { Request, Response } from 'express';
import { GameScheduleOptions } from '../models/Game';

@injectable()
export class GameController {
  constructor(@inject(GameService) private readonly gameService: GameService) {}

  public async generateScheduledMatchPlan(req: Request, res: Response): Promise<void> {
    console.log('Schedule matches of match plan');
    try {
      const matchPlan = await this.gameService.scheduleGames(req.body as Partial<GameScheduleOptions>);
      res.status(200).json(matchPlan);
    } catch (error) {
      res.status(500).json(error);
    }
  }

  // TODO: update api.json to return an error object for 500
  public async generateInitialMatchPlan(_req: Request, res: Response): Promise<void> {
    console.log('Generate match plan');
    try {
      const matchPlan = await this.gameService.createGames();
      res.status(200).json(matchPlan);
    } catch (error) {
      res.status(500).json(error);
    }
  }
}
