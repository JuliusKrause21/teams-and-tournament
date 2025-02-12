import { Filter, UpdateFilter } from 'mongodb';
import { TeamEntity } from './entities/TeamEntity';
import { inject, injectable } from 'inversify';
import { Database } from '../Database';

export enum TeamRepositoryError {
  FindTaskFailed = 'Could not find team in database',
  UpdateAcknowledgeFailed = 'Update team was not acknowledged',
}

export interface BulkUpdate {
  team_id: string | undefined;
  updateFields: Partial<TeamEntity>;
}

@injectable()
export class TeamRepository {
  constructor(@inject(Database) private readonly db: Database) {
    this.teamCollection = this.db.getCollection<TeamEntity>('teams');
  }

  private teamCollection;

  public findAll(filter: Filter<TeamEntity> = {}): Promise<TeamEntity[]> {
    return this.teamCollection.find(filter, { projection: { _id: 0 } }).toArray();
  }

  public groupByGroupNumber(): Promise<{ number: number; teams: TeamEntity[] }[]> {
    return this.teamCollection
      .aggregate<{ number: number; teams: TeamEntity[] }>([
        {
          $group: {
            _id: '$group',
            teams: {
              $push: '$$ROOT',
            },
          },
        },
        {
          $project: {
            _id: 0,
            number: '$_id',
            teams: 1,
          },
        },
      ])
      .toArray();
  }

  public async insert(teamEntity: TeamEntity) {
    await this.teamCollection.insertOne(teamEntity);
  }

  public async updateOne(team_id: string, updateFields: UpdateFilter<TeamEntity>): Promise<void> {
    const updateResult = await this.teamCollection.updateOne({ team_id }, { $set: updateFields });

    if (!updateResult.acknowledged) {
      throw new Error(TeamRepositoryError.UpdateAcknowledgeFailed);
    }
    if (updateResult.matchedCount === 0) {
      throw new Error(TeamRepositoryError.FindTaskFailed);
    }
  }

  public async bulkUpdate(bulkData: BulkUpdate[]): Promise<void> {
    console.log('Bulk update teams');
    const operations = bulkData.map((data) => ({
      updateOne: {
        filter: { team_id: data.team_id },
        update: { $set: data.updateFields },
      },
    }));

    await this.teamCollection.bulkWrite(operations);
  }
}
