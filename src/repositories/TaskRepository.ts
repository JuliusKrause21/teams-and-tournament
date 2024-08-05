import { inject, injectable } from 'inversify';
import { Database } from '../Database';
import { TaskEntity } from './entities/TaskEntity';

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

  public async insert(taskEntity: TaskEntity) {
    await this.taskCollection.insertOne(taskEntity);
  }
}
