import { inject, injectable } from 'inversify';
import { TasksService } from '../services/TasksService';
import { isTaskQueryOption } from '../models/Task';
import { Request, Response } from 'express';
import { TaskRepositoryError } from '../repositories/TaskRepository';

@injectable()
export class TasksController {
  constructor(@inject(TasksService) private readonly tasksService: TasksService) {}
  public async listTasks(req: Request, res: Response): Promise<void> {
    const query = isTaskQueryOption(req.query) ? req.query : undefined;
    try {
      const tasks = await this.tasksService.listTasks(query);
      res.status(200).json(tasks);
    } catch (error) {
      this.handleTasksErrors(error, res);
    }
  }

  public async findTask(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const task = this.tasksService.getTask(id);
      res.status(200).json(task);
    } catch (error) {
      this.handleTasksErrors(error, res);
    }
  }

  public async createTask(req: Request, res: Response): Promise<void> {
    try {
      const task = await this.tasksService.createTask(req.body);
      res.send(201).json(task);
    } catch (error) {
      this.handleTasksErrors(error, res);
    }
  }

  public async updateTask(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const task = await this.tasksService.updateTask(id, req.body);
      res.status(200).json(task);
    } catch (error) {
      this.handleTasksErrors(error, res);
    }
  }

  public async assignRandomly(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const task = await this.tasksService.assignRandomly(id);
      res.status(200).json(task);
    } catch (error) {
      this.handleTasksErrors(error, res);
    }
  }

  private handleTasksErrors(error: unknown, res: Response): void {
    if (error instanceof Error) {
      switch (error.message) {
        case TaskRepositoryError.FindTaskFailed:
          res.sendStatus(404);
          break;
        case TaskRepositoryError.UpdateMatchFailed:
        case TaskRepositoryError.UpdateAcknowledgeFailed:
        case TaskRepositoryError.InsertAcknowledgeFailed:
          res.sendStatus(500);
          break;
      }
    }
    res.sendStatus(500);
  }
}
