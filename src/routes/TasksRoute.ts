import { inject, injectable } from 'inversify';
import { Request, Response, Router } from 'express';
import { TasksController } from '../controllers/TasksController';

@injectable()
export class TasksRoute {
  constructor(@inject(TasksController) private readonly tasksController: TasksController) {}
  public registerRoutes() {
    const tasksRouter = Router();

    tasksRouter.get('/', async (req: Request, res: Response) => this.tasksController.listTasks(req, res));

    tasksRouter.get('/:id', async (req: Request, res: Response) => this.tasksController.findTask(req, res));

    tasksRouter.post('/', async (req: Request, res: Response) => this.tasksController.createTask(req, res));

    tasksRouter.put('/:id', async (req: Request, res: Response) => this.tasksController.updateTask(req, res));

    tasksRouter.put('/:id/assign', async (req: Request, res: Response) =>
      this.tasksController.assignRandomly(req, res)
    );

    return tasksRouter;
  }
}
