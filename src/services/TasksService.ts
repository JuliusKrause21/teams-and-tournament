import { inject, injectable } from 'inversify';
import { TaskRepository } from '../repositories/TaskRepository';
import { TaskEntity } from '../repositories/entities/TaskEntity';
import { isTaskQueryOption, Task, TaskQueryOptions } from '../models/Task';
import { MatchesService } from './MatchesService';

export enum TasksServiceError {
  NoMatch = 'No match available',
  MoreThanOneMatch = 'More than one match available',
  NoPlayersAssignable = 'No available players left to assign',
}

@injectable()
export class TasksService {
  constructor(
    @inject(TaskRepository) private readonly taskRepository: TaskRepository,
    @inject(MatchesService) private readonly matchesService: MatchesService
  ) {}

  public async listTasks(query?: TaskQueryOptions): Promise<Task[]> {
    /*
    This just returns the result of the repository call, but this is the place where the business logic is implemented
    Calls to several repositories, data combination and mapping takes place here.
     */
    const taskEntities = await this.taskRepository.findAll(this.mapQueryToEntityQuery(query));
    console.log(`Task entities: ${taskEntities}`);
    return taskEntities.map(this.mapTaskEntityToTask);
  }

  public async getTask(taskId: string): Promise<Task> {
    const taskEntity = await this.taskRepository.findById(taskId);
    return this.mapTaskEntityToTask(taskEntity);
  }

  public async createTask(task: Task): Promise<Task> {
    const test = new TaskEntity(this.mapTaskToTaskEntity(task));

    const taskEntity = await this.taskRepository.insert(test);
    return { ...this.mapTaskEntityToTask(taskEntity) };
  }

  public async updateTask(taskId: string, task: Task): Promise<Task> {
    console.log(`Update task with id ${taskId}`);
    const taskEntity = await this.taskRepository.findById(taskId);
    return this.updateTaskEntity(taskId, { ...taskEntity, ...this.mapTaskToTaskEntity(task) });
  }

  public async assignRandomly(taskId: string): Promise<Task> {
    console.log(`Randomly assign player to task with id ${taskId}`);
    const taskEntity = await this.taskRepository.findById(taskId);

    const resolved = taskEntity.resolved;

    // TODO: Include filter for not resolved tasks to repository
    if (resolved) {
      console.log('Task is already resolved');
      return this.mapTaskEntityToTask(taskEntity);
    }

    const matches = await this.matchesService.listMatches({ date: taskEntity.due_date });
    if (matches.length > 1) {
      console.log(`More than one match available on date ${taskEntity.due_date}`);
      throw new Error(TasksServiceError.MoreThanOneMatch);
    }
    if (matches.length === 0) {
      console.log(`No match available on date ${taskEntity.due_date}`);
      throw new Error(TasksServiceError.NoMatch);
    }

    let availablePlayers = matches[0].availablePlayers.filter(
      (availablePlayer) => !taskEntity.assigned.includes(availablePlayer)
    );

    if (availablePlayers.length === 0) {
      console.log('No available players left to assign');
      throw new Error(TasksServiceError.NoPlayersAssignable);
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

  private async updateTaskEntity(taskId: string, taskEntity: TaskEntity): Promise<Task> {
    await this.taskRepository.updateOne(taskId, taskEntity);
    return this.mapTaskEntityToTask(taskEntity);
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
      resolved: task.numberOfNeeds <= task.assignedPlayers.length,
    };
  }

  private mapTaskEntityToTask(taskEntity: TaskEntity): Task {
    return {
      type: taskEntity.type,
      taskId: taskEntity.task_id,
      description: taskEntity.description,
      assignedPlayers: taskEntity.assigned,
      dueDate: taskEntity.due_date,
      numberOfNeeds: taskEntity.number_of_needs,
    };
  }
}
