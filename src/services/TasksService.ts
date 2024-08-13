import { inject, injectable } from 'inversify';
import { TaskRepository } from '../repositories/TaskRepository';
import { TaskEntity } from '../repositories/entities/TaskEntity';
import { isTaskQueryOption, Task, TaskQueryOptions } from '../models/Task';
import { ApiResponse } from '../models/ApiResponse';
import { games } from '../dummyData';

@injectable()
export class TasksService {
  constructor(@inject(TaskRepository) private readonly taskRepository: TaskRepository) {}

  public async listTasks(query?: TaskQueryOptions): Promise<ApiResponse<Task[]>> {
    /*
    This just returns the result of the repository call, but this is the place where the business logic is implemented
    Calls to several repositories, data combination and mapping takes place here.
     */
    const taskEntities = await this.taskRepository.findAll(this.mapQueryToEntityQuery(query));
    console.log(`Task entities: ${taskEntities}`);
    return { statusCode: 200, body: taskEntities.map(this.mapTaskEntityToTask) };
  }

  public async getTask(taskId: string): Promise<ApiResponse<Task>> {
    const taskEntity = await this.taskRepository.findByTaskId(taskId);
    if (!taskEntity) {
      return { statusCode: 404 };
    }
    return { statusCode: 200, body: this.mapTaskEntityToTask(taskEntity) };
  }

  public async createTask(task: Task): Promise<ApiResponse<undefined>> {
    const taskEntity = new TaskEntity(this.mapTaskToTaskEntity(task));
    taskEntity.resolved = taskEntity.assigned.length === taskEntity.number_of_needs;
    const insertResult = await this.taskRepository.insert(taskEntity);
    if (!insertResult.acknowledged) {
      return { statusCode: 500 };
    }
    return { statusCode: 201 };
  }

  public async updateTask(taskId: string, task: Task): Promise<ApiResponse<undefined>> {
    console.log(`Update task with id ${taskId}`);
    const taskEntity = this.mapTaskToTaskEntity(task);
    return this.updateTaskEntity(taskId, taskEntity);
  }

  public async assignRandomly(taskId: string): Promise<ApiResponse<undefined>> {
    console.log(`Randomly assign player to task with id ${taskId}`);
    const taskEntity = await this.taskRepository.findByTaskId(taskId);
    if (!taskEntity) {
      return { statusCode: 404 };
    }

    const missingPlayers = taskEntity.number_of_needs - taskEntity.assigned.length;
    if (missingPlayers <= 0) {
      // TODO: Logging statement and correct error message
      return { statusCode: 200 };
    }

    // TODO: Replace dummy data by call to games repository and extend unit test
    const game = games.find((game) => game.date === taskEntity.due_date);
    if (!game) {
      return { statusCode: 404 };
    }

    let availablePlayers = game.availablePlayers.filter(
      (availablePlayer) => !taskEntity.assigned.includes(availablePlayer)
    );
    if (availablePlayers.length === 0) {
      // TODO: Logging statement and correct error message and extend unit test
      return { statusCode: 500 };
    }

    while (taskEntity.resolved === false) {
      const randomPlayer = availablePlayers[Math.floor(Math.random() * availablePlayers?.length)];
      availablePlayers = availablePlayers.filter((availablePlayer) => availablePlayer !== randomPlayer);

      taskEntity.assigned.push(randomPlayer);
      taskEntity.resolved = taskEntity.number_of_needs === taskEntity.assigned.length;
    }

    console.table(taskEntity);
    return this.updateTaskEntity(taskId, taskEntity);
  }

  private async updateTaskEntity(taskId: string, taskEntity: TaskEntity): Promise<ApiResponse<undefined>> {
    taskEntity.resolved = taskEntity.assigned.length === taskEntity.number_of_needs;
    const updateResult = await this.taskRepository.updateOne(taskId, taskEntity);
    if (!updateResult.acknowledged) {
      return { statusCode: 500 };
    }
    if (updateResult.matchedCount === 0) {
      return { statusCode: 404 };
    }
    return { statusCode: 200 };
  }

  private mapQueryToEntityQuery(taskQuery?: TaskQueryOptions): Partial<TaskEntity> | undefined {
    if (!isTaskQueryOption(taskQuery)) {
      return;
    }
    return {
      due_date: taskQuery.dueDate,
    };
  }

  private mapTaskToTaskEntity(task: Task): TaskEntity {
    return {
      type: task.type,
      description: task.description,
      number_of_needs: task.numberOfNeeds,
      assigned: task.assignedPlayers,
      due_date: task.dueDate,
    };
  }

  private mapTaskEntityToTask(taskEntity: TaskEntity): Task {
    return {
      type: taskEntity.type,
      description: taskEntity.description,
      assignedPlayers: taskEntity.assigned,
      dueDate: taskEntity.due_date,
      numberOfNeeds: taskEntity.number_of_needs,
    };
  }
}
