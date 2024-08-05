import { inject, injectable } from 'inversify';
import { Request, Response, Router } from 'express';
import { TasksController } from '../controllers/TasksController';
import { TaskQueryOptions } from '../models/Task';

@injectable()
export class TasksRoute {
  constructor(@inject(TasksController) private readonly tasksController: TasksController) {}
  public registerRoutes() {
    const tasksRouter = Router();

    tasksRouter.get('/', async (req: Request, res: Response) => {
      console.log(`List tasks with query ${JSON.stringify(req.query)}`);
      const { dueDate } = req.query;
      const { statusCode, body } = await this.tasksController.listTasks({ dueDate } as TaskQueryOptions);
      res.status(statusCode).json(body);
    });

    tasksRouter.get('/:id', async (req: Request, res: Response) => {
      const { id } = req.params;
      console.log(`Getting task with id ${id}`);
      const { statusCode, body } = await this.tasksController.getTask(id);
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
