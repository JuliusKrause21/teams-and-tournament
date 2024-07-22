import 'reflect-metadata';
import { Database } from './Database';
import { container } from './inversify.config';
import { Server } from './Server';

async function start(): Promise<void> {
  console.log('Hello World');

  const uri = 'mongodb://localhost:27017/test';

  const db = container.get(Database);
  await db.connect(uri);

  const server = container.get(Server);
  server.start();
}

void start();
