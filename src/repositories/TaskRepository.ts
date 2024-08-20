import { inject, injectable } from 'inversify';
import { Database } from '../Database';
import { TaskEntity } from './entities/TaskEntity';
import { Filter, UpdateFilter } from 'mongodb';
import { MatchEntity } from './entities/MatchEntity';

export enum TaskRepositoryError {
  FindTaskFailed = 'Could not find task in database',
  UpdateAcknowledgeFailed = 'Update task was not acknowledged',
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

  public async findById(task_id: string): Promise<TaskEntity> {
    console.log(`Get task entity with id ${task_id}`);
    const taskEntity = await this.taskCollection.findOne({ task_id }, { projection: { _id: 0 } });
    if (taskEntity === null) {
      throw new Error(TaskRepositoryError.FindTaskFailed);
    }
    return taskEntity;
  }

  public async insert(taskEntity: TaskEntity): Promise<TaskEntity> {
    await this.taskCollection.insertOne(taskEntity);
    return taskEntity;
  }

  public async bulkInsert(taskEntities: TaskEntity[]): Promise<void> {
    const result = await this.taskCollection.insertMany(taskEntities);
    if (!result.acknowledged) {
      throw new Error(TaskRepositoryError.InsertAcknowledgeFailed);
    }
  }

  public async updateOne(task_id: string, updateFields: UpdateFilter<MatchEntity>): Promise<void> {
    const updateResult = await this.taskCollection.updateOne({ task_id }, { $set: updateFields });

    if (!updateResult.acknowledged) {
      throw new Error(TaskRepositoryError.UpdateAcknowledgeFailed);
    }
    if (updateResult.matchedCount === 0) {
      throw new Error(TaskRepositoryError.FindTaskFailed);
    }
  }
}
