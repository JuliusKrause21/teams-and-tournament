import { inject, injectable } from 'inversify';
import { Database } from '../Database';
import { TaskEntity } from './entities/TaskEntity';
import { Filter } from 'mongodb';

@injectable()
export class TaskRepository {
  constructor(@inject(Database) private readonly db: Database) {
    this.taskCollection = this.db.getCollection<TaskEntity>('tasks');
  }

  private taskCollection;

  public findAll(filter: Filter<TaskEntity> = {}): Promise<TaskEntity[]> {
    console.log(`Filter task repository with query ${JSON.stringify(filter)}`);
    return this.taskCollection.find(filter, { projection: { _id: 0 } }).toArray();
  }

  public findByTaskId(taskId: string): Promise<TaskEntity | null> {
    console.log(`Get task entity with id ${taskId}`);
    return this.taskCollection.findOne({ task_id: taskId }, { projection: { _id: 0 } });
  }

  public async insert(taskEntity: TaskEntity) {
    await this.taskCollection.insertOne(taskEntity);
  }
}
