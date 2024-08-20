import { inject, injectable } from 'inversify';
import { Request, Response } from 'express';
import { Scheduler } from '../Scheduler';

@injectable()
export class JobsController {
  constructor(@inject(Scheduler) private readonly scheduler: Scheduler) {}

  public async triggerFirstJob(_req: Request, res: Response): Promise<void> {
    try {
      await this.scheduler.runJob('FirstJob');
      res.sendStatus(200);
    } catch (error) {
      res.sendStatus(500);
    }
  }
}
