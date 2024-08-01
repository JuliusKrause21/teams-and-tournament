import { inject, injectable } from 'inversify';
import { Request, Response, Router } from 'express';
import { TasksController } from '../controllers/TasksController';

@injectable()
export class TasksRoute {
  constructor(@inject(TasksController) private readonly tasksController: TasksController) {}
  public registerRoutes() {
    const tasksRouter = Router();
    tasksRouter.get('/', async (_req: Request, res: Response) => {
      const { statusCode, body } = await this.tasksController.listTasks();
      res.status(statusCode).json(body);
    });
    tasksRouter.post('/', async (req: Request, res: Response) => {
      const { body } = req;
      const { statusCode } = await this.tasksController.createTask(body);
      res.status(statusCode).send();
    });
    return tasksRouter;
  }
}
