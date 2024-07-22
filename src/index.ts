import 'reflect-metadata';
import { Application } from './Application';
import { container } from './inversify.config';

async function start(): Promise<void> {
  console.log('Hello World');
  await Application.startup(container);
}

void start();
