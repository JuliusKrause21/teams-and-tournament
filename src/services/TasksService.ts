import { inject, injectable } from 'inversify';
import { TaskRepository } from '../repositories/TaskRepository';
import { TaskEntity } from '../repositories/entities/TaskEntity';
import { isTaskQueryOption, Task, TaskQueryOptions } from '../models/Task';
import { ApiResponse } from '../models/ApiResponse';
import { MatchesService } from './MatchesService';

@injectable()
export class TasksService {
  constructor(
    @inject(TaskRepository) private readonly taskRepository: TaskRepository,
    @inject(MatchesService) private readonly matchesService: MatchesService
  ) {}

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

  public async updateTask(taskId: string, task: Task): Promise<ApiResponse<Task | undefined>> {
    console.log(`Update task with id ${taskId}`);
    const taskEntity = this.mapTaskToTaskEntity(task);
    return this.updateTaskEntity(taskId, taskEntity);
  }

  public async assignRandomly(taskId: string): Promise<ApiResponse<Task | undefined>> {
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

    const matches = await this.matchesService.listMatches({ date: taskEntity.due_date });
    if (matches.length > 1) {
      return { statusCode: 500 };
    }
    if (matches.length === 0) {
      return { statusCode: 200 };
    }

    let availablePlayers = matches[0].availablePlayers.filter(
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

  private async updateTaskEntity(taskId: string, taskEntity: TaskEntity): Promise<ApiResponse<Task | undefined>> {
    taskEntity.resolved = taskEntity.assigned.length === taskEntity.number_of_needs;
    await this.taskRepository.updateOne(taskId, taskEntity);
    return { statusCode: 200, body: this.mapTaskEntityToTask(taskEntity) };
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
