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
      return this.tasksService.getTask(taskId);
    } catch (error) {
      return { statusCode: 500 };
    }
  }

  public async createTask(task: Task): Promise<ApiResponse<undefined>> {
    try {
      return this.tasksService.createTask(task);
    } catch (error) {
      return { statusCode: 500 };
    }
  }

  public async updateTask(taskId: string, task: Task): Promise<ApiResponse<undefined>> {
    try {
      const { statusCode } = await this.tasksService.updateTask(taskId, task);
      return { statusCode };
    } catch (error) {
      // Here the error is lost, it should not be presented to the user but it should be logged.
      return { statusCode: 500 };
    }
  }

  public async assignRandomly(taskId: string): Promise<ApiResponse<undefined>> {
    try {
      const { statusCode } = await this.tasksService.assignRandomly(taskId);
      return { statusCode };
    } catch (error) {
      // Here the error is lost, it should not be presented to the user but it should be logged.
      return { statusCode: 500 };
    }
  }
}
