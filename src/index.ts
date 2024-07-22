import 'reflect-metadata';
import { Application } from './Application';
import { container } from './inversify.config';

async function start(): Promise<void> {
  console.log('Hello World');
  try {
    await Application.startup(container);
  } catch (error) {
    console.error('Uncaught exception', {}, error);
  }
}

void start();
