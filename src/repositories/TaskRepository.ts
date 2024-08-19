import { inject, injectable } from 'inversify';
import { Database } from '../Database';
import { TaskEntity } from './entities/TaskEntity';
import { Filter, InsertOneResult, UpdateFilter, UpdateResult } from 'mongodb';

export enum TaskRepositoryError {
  InsertAcknowledgeFailed = 'Insert was not acknowledged',
}

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

  public findByTaskId(task_id: string): Promise<TaskEntity | null> {
    console.log(`Get task entity with id ${task_id}`);
    return this.taskCollection.findOne({ task_id }, { projection: { _id: 0 } });
  }

  public async insert(taskEntity: TaskEntity): Promise<InsertOneResult<TaskEntity>> {
    return this.taskCollection.insertOne(taskEntity);
  }

  public async bulkInsert(taskEntities: TaskEntity[]): Promise<void> {
    const result = await this.taskCollection.insertMany(taskEntities);
    if (!result.acknowledged) {
      throw new Error(TaskRepositoryError.InsertAcknowledgeFailed);
    }
  }

  public async updateOne(task_id: string, updateFields: UpdateFilter<TaskEntity>): Promise<UpdateResult<TaskEntity>> {
    return this.taskCollection.updateOne({ task_id }, { $set: updateFields });
  }
}
