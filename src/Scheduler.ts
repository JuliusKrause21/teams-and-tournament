import { Pulse } from '@pulsecron/pulse';
import { inject, injectable } from 'inversify';
import { Job, PulseJob } from './jobs/Job';

@injectable()
export class Scheduler {
  constructor(@inject(Job) private readonly job: Job) {}

  private pulse: Pulse | undefined;
  private pulseConfig = {
    processEvery: '1 minute',
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

  private async scheduleJob(pulseJob: PulseJob): Promise<void> {
    this.pulse?.define(pulseJob.name, (_job, done) => {
      pulseJob.handler();
      done();
    });
    await this.pulse?.every(pulseJob.schedule, pulseJob.name, {});
  }
}
