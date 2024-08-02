import { inject, injectable } from 'inversify';
import { ApiResponse } from '../models/ApiResponse';
import { TasksService } from '../services/TasksService';
import { Task } from '../models/Task';

@injectable()
export class TasksController {
  constructor(@inject(TasksService) private readonly tasksService: TasksService) {}
  public async listTasks(): Promise<ApiResponse<Task[]>> {
    try {
      const tasks = await this.tasksService.listTasks();
      return { statusCode: 200, body: tasks };
    } catch (error) {
      return { statusCode: 500 };
    }
  }

  public async createTask(task: Task): Promise<ApiResponse<undefined>> {
    try {
      await this.tasksService.createTask(task);
      return { statusCode: 201 };
    } catch (error) {
      return { statusCode: 500 };
    }
  }
}
