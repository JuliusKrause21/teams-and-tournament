import express, { Request, Response } from 'express';
import { TeamService } from './services/TeamService';
import { MatchService } from './services/MatchService';
import { Database } from './Database';

async function start(): Promise<void> {
  console.log('Hello World');

  const uri = 'mongodb://localhost:27017/test';

  const app = express();

  // Instantiation should be done with inversify container
  const db = await new Database(uri).getDb();
  const teamsService = new TeamService(db);
  const matchService = new MatchService(db);

  app.get('/teams', async (_req: Request, res: Response) => {
    const teams = await teamsService.listTeams();
    res.status(200).json(teams);
  });

  app.get('/matches', async (_req: Request, res: Response) => {
    const matches = await matchService.listMatches();
    res.status(200).json(matches);
  });

  app.get('/', (_req: Request, res: Response) => {
    res.status(200).send('Hello world\n');
  });

  app.listen(3000, () => console.log('Server listen on port 3000'));
}

void start();
