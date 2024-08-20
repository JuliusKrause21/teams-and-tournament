import { injectable } from 'inversify';
import { Job } from '../Scheduler';

@injectable()
export class FirstJob implements Job {
  constructor() {}

  public schedule() {
    return {
      handler: () => {
        const date = new Date().toISOString();
        console.log(date);
      },
      name: 'FirstJob',
      schedule: '10 minutes',
    };
  }
}
