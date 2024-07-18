import express, { Request, Response } from 'express';
import { MongoClient, ObjectId } from 'mongodb';

function start(): void {
  console.log('Hello World');

  const uri = 'mongodb://localhost:27017';
  const client = new MongoClient(uri);

  const app = express();

  class Team {
    constructor(
      public _id: ObjectId,
      public name: string
    ) {}
  }

  class Match {
    constructor(
      public _id: ObjectId,
      public date: number
    ) {}
  }

  const db = client.db('test');

  app.get('/teams', async (_req: Request, res: Response) => {
    const teams = await db.collection<Team>('teams').find().toArray();
    res.status(200).json(teams);
  });

  app.get('/matches', async (_req: Request, res: Response) => {
    const matches = await db.collection<Match>('matches').find().toArray();
    res.status(200).json(matches);
  });

  app.get('/', (_req: Request, res: Response) => {
    res.status(200).send('Hello world\n');
  });

  app.listen(3000, () => console.log('Server listen on port 3000'));
}

start();
