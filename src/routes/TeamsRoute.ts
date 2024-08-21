import { Request, Response, Router } from 'express';
import { inject, injectable } from 'inversify';
import { TeamsController } from '../controllers/TeamsController';

@injectable()
export class TeamsRoute {
  constructor(@inject(TeamsController) private readonly teamsController: TeamsController) {}
  public registerRoutes() {
    const teamsRouter = Router();
    teamsRouter.get('/', async (req: Request, res: Response) => this.teamsController.listTeams(req, res));

    teamsRouter.post('/', async (req: Request, res: Response) => this.teamsController.createTeam(req, res));

    teamsRouter.post('/shuffle', async (req: Request, res: Response) => this.teamsController.shuffleGroups(req, res));
    return teamsRouter;
  }
}
