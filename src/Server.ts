import { inject, injectable } from 'inversify';
import { TeamsRoute } from './routes/TeamsRoute';
import { MatchesRoute } from './routes/MatchesRoute';
import express, { Request, Response } from 'express';

@injectable()
export class Server {
  constructor(
    @inject(TeamsRoute) private teamsRoute: TeamsRoute,
    @inject(MatchesRoute) private readonly matchesRoute: MatchesRoute
  ) {}

  public start() {
    const app = express();

    app.use('/teams', this.teamsRoute.registerRoutes());
    app.use('/matches', this.matchesRoute.registerRoutes());

    app.get('/', (_req: Request, res: Response) => {
      res.status(200).send('Hello world\n');
    });

    app.listen(3000, () => console.log('Server listen on port 3000'));
    return app;
  }
}
