import { Filter, UpdateFilter } from 'mongodb';
import { TeamEntity } from './entities/TeamEntity';
import { inject, injectable } from 'inversify';
import { Database } from '../Database';
import { err, ok, Result } from 'neverthrow';

export enum TeamRepositoryError {
  TeamsNotFound = 'Could not find team in database',
  GroupingOfTeamsFailed = 'Could not aggregate groups',
  InsertFailed = 'Could not insert teams in db',
  InsertAcknowledgeFailed = 'Insert team was not acknowledged',
  UpdateFailed = 'Could not update team in db',
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

  public async findAll(filter: Filter<TeamEntity> = {}): Promise<Result<TeamEntity[], Error>> {
    try {
      const result = await this.teamCollection.find(filter, { projection: { _id: 0 } }).toArray();
      return ok(result);
    } catch (error) {
      return err(new Error(TeamRepositoryError.TeamsNotFound, { cause: error }));
    }
  }

  public async groupByGroupNumber(): Promise<Result<{ number: number; teams: TeamEntity[] }[], Error>> {
    try {
      const result = await this.teamCollection
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
      return ok(result);
    } catch (error) {
      return err(new Error(TeamRepositoryError.GroupingOfTeamsFailed, { cause: error }));
    }
  }

  public async insert(teamEntity: TeamEntity): Promise<Result<undefined, Error>> {
    try {
      const result = await this.teamCollection.insertOne(teamEntity);
      if (!result.acknowledged) {
        return err(new Error(TeamRepositoryError.InsertAcknowledgeFailed));
      }
      return ok(undefined);
    } catch (error) {
      return err(new Error(TeamRepositoryError.InsertFailed, { cause: error }));
    }
  }

  public async updateOne(team_id: string, updateFields: UpdateFilter<TeamEntity>): Promise<Result<undefined, Error>> {
    try {
      const result = await this.teamCollection.updateOne({ team_id }, { $set: updateFields });

      if (!result.acknowledged) {
        return err(new Error(TeamRepositoryError.UpdateAcknowledgeFailed));
      }
      return ok(undefined);
    } catch (error) {
      return err(new Error(TeamRepositoryError.UpdateFailed, { cause: error }));
    }
  }

  public async bulkUpdate(bulkData: BulkUpdate[]): Promise<Result<undefined, Error>> {
    console.log('Bulk update teams');
    // TODO: Move to caller
    const operations = bulkData.map((data) => ({
      updateOne: {
        filter: { team_id: data.team_id },
        update: { $set: data.updateFields },
      },
    }));

    try {
      await this.teamCollection.bulkWrite(operations);
      return ok(undefined);
    } catch (error) {
      return err(new Error(TeamRepositoryError.UpdateFailed, { cause: error }));
    }
  }
}
