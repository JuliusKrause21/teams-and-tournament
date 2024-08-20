import { injectable } from 'inversify';
import { Job } from '../Scheduler';

@injectable()
export class FirstJob implements Job {
  constructor() {}

  public schedule() {
    return {
      handler: () => console.log('Hello'),
      name: 'Hello',
      schedule: '1 second',
    };
  }
}
