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

    matchesRouter.get('/:id', async (req: Request, res: Response) => {
      const { id } = req.params;
      const { statusCode, body } = await this.matchesController.findMatch(id);
      res.status(statusCode).json(body);
    });

    matchesRouter.put('/:id', async (req: Request, res: Response) => {
      const { id } = req.params;
      const { statusCode, body } = await this.matchesController.updateMatch(id, req.body);
      res.status(statusCode).json(body);
    });

    matchesRouter.post('/import', async (_req: Request, res: Response) => {
      const { statusCode, body } = await this.matchesController.importMatches();
      res.status(statusCode).json(body);
    });

    return matchesRouter;
  }
}
