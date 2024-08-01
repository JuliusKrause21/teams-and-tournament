import { inject, injectable } from 'inversify';
import { Database } from '../Database';
import { TaskEntity } from './entities/TaskEntity';

@injectable()
export class TaskRepository {
  constructor(@inject(Database) private readonly db: Database) {
    this.taskCollection = this.db.getCollection<TaskEntity>('tasks');
  }

  private taskCollection;

  public findAll(): Promise<TaskEntity[]> {
    return this.taskCollection.find({}, { projection: { _id: 0 } }).toArray();
  }

  public async insert(taskEntity: TaskEntity) {
    await this.taskCollection.insertOne(taskEntity);
  }
}
