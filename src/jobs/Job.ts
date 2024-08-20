import { injectable } from 'inversify';

export interface PulseJob {
  handler: () => void;
  schedule: string;
  name: string;
}

@injectable()
export class Job {
  constructor() {}

  public schedule(): PulseJob {
    return {
      handler: () => console.log('Hello'),
      name: 'Hello',
      schedule: '1 second',
    };
  }
}
