import { inject, injectable } from 'inversify';
import { TaskRepository } from '../repositories/TaskRepository';
import { TaskEntity } from '../repositories/entities/TaskEntity';
import { Task } from '../models/Task';

@injectable()
export class TasksService {
  constructor(@inject(TaskRepository) private readonly taskRepository: TaskRepository) {}

  public async listTasks(): Promise<Task[]> {
    /*
    This just returns the result of the repository call, but this is the place where the business logic is implemented
    Calls to several repositories, data combination and mapping takes place here.
     */
    const taskEntities = await this.taskRepository.findAll();
    return taskEntities.map((taskEntity) => ({
      type: taskEntity.type,
      assignedPlayers: taskEntity.assigned,
      dueDate: taskEntity.due_date,
      numberOfNeeds: taskEntity.number_of_needs,
    }));
  }

  public async createTask(taskEntity: TaskEntity): Promise<void> {
    await this.taskRepository.insert(taskEntity);
  }
}
