import { Request, Response, Router } from 'express';
import { inject, injectable } from 'inversify';
import { MatchesController } from '../controllers/MatchesController';

@injectable()
export class MatchesRoute {
  constructor(@inject(MatchesController) private readonly matchesController: MatchesController) {}
  public registerRoutes() {
    const matchesRouter = Router();
    matchesRouter.get('/', async (req: Request, res: Response) => this.matchesController.listMatches(req, res));

    matchesRouter.get('/:id', async (req: Request, res: Response) => this.matchesController.findMatch(req, res));

    matchesRouter.put('/:id', async (req: Request, res: Response) => this.matchesController.updateMatch(req, res));

    matchesRouter.post('/import', async (req: Request, res: Response) =>
      this.matchesController.importMatches(req, res)
    );

    return matchesRouter;
  }
}
