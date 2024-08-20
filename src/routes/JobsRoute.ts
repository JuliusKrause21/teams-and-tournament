import { inject, injectable } from 'inversify';
import { Request, Response, Router } from 'express';
import { JobsController } from '../controllers/JobsController';

@injectable()
export class JobsRoute {
  constructor(@inject(JobsController) private readonly jobsController: JobsController) {}
  public registerRoutes() {
    const jobsRouter = Router();
    jobsRouter.post('/trigger-first-job', async (req: Request, res: Response) =>
      this.jobsController.triggerFirstJob(req, res)
    );

    return jobsRouter;
  }
}
