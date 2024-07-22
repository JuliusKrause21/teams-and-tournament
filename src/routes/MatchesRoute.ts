import { Request, Response, Router } from 'express';
import { inject, injectable } from 'inversify';
import { MatchesController } from '../controllers/MatchesController';

@injectable()
export class MatchesRoute {
  constructor(@inject(MatchesController) private readonly matchesController: MatchesController) {}
  public registerRoutes() {
    const matchesRouter = Router();
    matchesRouter.get('/', async (_req: Request, res: Response) => {
      const { statusCode, body } = await this.matchesController.listMatches();
      res.status(statusCode).json(body);
    });
    return matchesRouter;
  }
}
