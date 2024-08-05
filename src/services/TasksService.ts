import { inject, injectable } from 'inversify';
import { TaskRepository } from '../repositories/TaskRepository';
import { TaskEntity } from '../repositories/entities/TaskEntity';
import { Task, TaskQueryOptions } from '../models/Task';

@injectable()
export class TasksService {
  constructor(@inject(TaskRepository) private readonly taskRepository: TaskRepository) {}

  public async listTasks(query?: TaskQueryOptions): Promise<Task[]> {
    /*
    This just returns the result of the repository call, but this is the place where the business logic is implemented
    Calls to several repositories, data combination and mapping takes place here.
     */
    const taskEntities = await this.taskRepository.findAll(this.mapQueryToEntityQuery(query));
    console.log(`Task entities: ${taskEntities}`);
    return taskEntities.map(this.mapTaskEntityToTask);
  }

  public async createTask(task: Task): Promise<void> {
    const taskEntity = new TaskEntity(this.mapTaskToTaskEntity(task));
    await this.taskRepository.insert(taskEntity);
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
      number_of_needs: task.numberOfNeeds,
      assigned: task.assignedPlayers,
      due_date: task.dueDate,
    };
  }

  private mapTaskEntityToTask(taskEntity: TaskEntity): Task {
    return {
      type: taskEntity.type,
      assignedPlayers: taskEntity.assigned,
      dueDate: taskEntity.due_date,
      numberOfNeeds: taskEntity.number_of_needs,
    };
  }
}
