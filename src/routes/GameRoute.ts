import { inject, injectable } from 'inversify';
import { GameController } from '../controllers/GameConstroller';
import { Request, Response, Router } from 'express';

@injectable()
export class GameRoute {
  constructor(@inject(GameController) private readonly gameController: GameController) {}

  public registerRoutes() {
    const gameRouter = Router();

    gameRouter.post('/create-initial-match-plan', async (req: Request, res: Response) =>
      this.gameController.generateInitialMatchPlan(req, res)
    );

    gameRouter.post('/schedule-match-plan', async (req: Request, res: Response) =>
      this.gameController.generateScheduledMatchPlan(req, res)
    );

    return gameRouter;
  }
}
