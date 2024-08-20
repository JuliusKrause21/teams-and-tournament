import { Pulse } from '@pulsecron/pulse';
import { inject, injectable } from 'inversify';
import { FirstJob } from './jobs/FirstJob';

export interface PulseJob {
  handler: () => void;
  schedule: string;
  name: string;
}

export interface Job {
  schedule: () => PulseJob;
}

@injectable()
export class Scheduler {
  constructor(@inject(FirstJob) private readonly job: FirstJob) {}

  private pulse: Pulse | undefined;
  private pulseConfig = {
    processEvery: '1 day',
    maxConcurrency: 10,
    db: {
      address: 'mongodb://localhost:27017/jobs',
      collection: 'jobQueue',
    },
  };

  public async start() {
    console.log('Start scheduler');
    this.pulse = new Pulse(this.pulseConfig);

    this.pulse.on('success', (job) => {
      console.log(`Job <${job.attrs.name}> succeeded`);
    });

    this.pulse.on('fail', (error, job) => {
      console.log(`Job <${job.attrs.name}> failed:`, error);
    });

    await this.pulse.start();
    await this.scheduleJob(this.job.schedule());
  }

  public async runJob(name: string): Promise<void> {
    const job = await this.pulse?.jobs({ name });
    if (!job || job.length === 0) {
      throw new Error('Could not run job');
    }
    job[0].run();
  }

  private async scheduleJob(pulseJob: PulseJob): Promise<void> {
    this.pulse?.define(pulseJob.name, (_job, done) => {
      pulseJob.handler();
      done();
    });
    await this.pulse?.every(pulseJob.schedule, pulseJob.name, {});
  }
}
