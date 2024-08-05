import { inject, injectable } from 'inversify';
import { ApiResponse } from '../models/ApiResponse';
import { TasksService } from '../services/TasksService';
import { Task, TaskQueryOptions } from '../models/Task';

@injectable()
export class TasksController {
  constructor(@inject(TasksService) private readonly tasksService: TasksService) {}
  public async listTasks(query?: TaskQueryOptions): Promise<ApiResponse<Task[]>> {
    try {
      const { statusCode, body } = await this.tasksService.listTasks(query);
      return { statusCode, body };
    } catch (error) {
      return { statusCode: 500 };
    }
  }

  public async getTask(taskId: string): Promise<ApiResponse<Task>> {
    try {
      const { statusCode, body } = await this.tasksService.getTask(taskId);
      return { statusCode, body };
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
