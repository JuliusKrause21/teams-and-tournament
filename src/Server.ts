import { inject, injectable } from 'inversify';
import { TeamsRoute } from './routes/TeamsRoute';
import { MatchesRoute } from './routes/MatchesRoute';
import express, { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import { middleware } from 'express-openapi-validator';
import bodyParser from 'body-parser';
import path from 'node:path';

@injectable()
export class Server {
  constructor(
    @inject(TeamsRoute) private teamsRoute: TeamsRoute,
    @inject(MatchesRoute) private readonly matchesRoute: MatchesRoute
  ) {}

  public start() {
    console.log('Starting express server');
    const app = express();

    app.use(bodyParser.json());

    app.use(middleware({ apiSpec: path.join(__dirname, './api.json'), validateRequests: true }));

    app.use((req: Request, _res: Response, next: NextFunction) => {
      const date = Date.now().toString();
      console.log(date, req.method, req.hostname, req.path);
      next();
    });

    app.use('/teams', this.teamsRoute.registerRoutes());
    app.use('/matches', this.matchesRoute.registerRoutes());

    app.use((err: ErrorRequestHandler, _req: Request, res: Response, _next: NextFunction) => {
      console.log('Custom error handler');
      res.status(500).json({
        err,
      });
    });

    app.listen(3000, () => console.log('Server listen on port 3000'));
  }
}
