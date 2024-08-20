import { inject, injectable } from 'inversify';
import { TeamsRoute } from './routes/TeamsRoute';
import { MatchesRoute } from './routes/MatchesRoute';
import express, { NextFunction, Request, Response } from 'express';
import { middleware } from 'express-openapi-validator';
import bodyParser from 'body-parser';
import path from 'node:path';
import { TasksRoute } from './routes/TasksRoute';
import { HttpError } from 'express-openapi-validator/dist/framework/types';
import { isOpenApiError } from './models/OpenApiError';
import swaggerUi from 'swagger-ui-express';
import apiJson from './api.json';

@injectable()
export class Server {
  constructor(
    @inject(TeamsRoute) private teamsRoute: TeamsRoute,
    @inject(MatchesRoute) private readonly matchesRoute: MatchesRoute,
    @inject(TasksRoute) private readonly tasksRoute: TasksRoute
  ) {}

  public start() {
    console.log('Starting express server');
    const app = express();

    app.use(bodyParser.json());

    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(apiJson));

    app.use(
      middleware({ apiSpec: path.join(__dirname, './api.json'), validateRequests: true, validateResponses: true })
    );

    app.use((req: Request, _res: Response, next: NextFunction) => {
      const date = Date.now().toString();
      console.log(date, req.method, req.hostname, req.path);
      next();
    });

    app.use('/teams', this.teamsRoute.registerRoutes());
    app.use('/matches', this.matchesRoute.registerRoutes());
    app.use('/tasks', this.tasksRoute.registerRoutes());

    app.use((err: unknown, _req: Request, res: Response) => {
      console.log('Custom error handler');
      if (isOpenApiError(err)) {
        const { status, message } = err as HttpError;
        res.status(status || 500).send(message);
      } else {
        res.status(500).json({
          err,
        });
      }
    });

    app.listen(3000, () => console.log('Server listen on port 3000'));
  }
}
