import 'reflect-metadata';

import express, { Request, Response } from 'express';
import { Database } from './Database';
import { container } from './inversify.config';
import { TeamsRoute } from './routes/TeamsRoute';
import { MatchesRoute } from './routes/MatchesRoute';

async function start(): Promise<void> {
  console.log('Hello World');

  const uri = 'mongodb://localhost:27017/test';

  const app = express();

  const db = container.get(Database);
  await db.connect(uri);

  // Instantiation should be done with inversify container of services
  const teamsRoute = container.get(TeamsRoute);
  const matchesRoute = container.get(MatchesRoute);

  app.use('/teams', teamsRoute.registerRoutes());
  app.use('/matches', matchesRoute.registerRoutes());

  app.get('/', (_req: Request, res: Response) => {
    res.status(200).send('Hello world\n');
  });

  app.listen(3000, () => console.log('Server listen on port 3000'));
}

void start();
