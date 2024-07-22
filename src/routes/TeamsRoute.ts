import { Request, Response, Router } from 'express';
import { inject, injectable } from 'inversify';
import { TeamsController } from '../controllers/TeamsController';

@injectable()
export class TeamsRoute {
  constructor(@inject(TeamsController) private readonly teamsController: TeamsController) {}
  public registerRoutes() {
    const teamsRouter = Router();
    teamsRouter.get('', async (_req: Request, res: Response) => {
      const { statusCode, body } = await this.teamsController.listTeams();
      res.status(statusCode).json(body);
    });
    return teamsRouter;
  }
}
