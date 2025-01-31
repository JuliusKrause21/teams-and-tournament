import { ObjectId } from 'mongodb';
import { v4 as uuid } from 'uuid';

export class TeamEntity {
  public _id?: ObjectId;
  public name: string;
  public team_id?: string;
  public group?: number;
  public games?: string[];

  constructor({
    name,
    team_id = uuid(),
    group,
    games = [],
  }: {
    name: string;
    team_id?: string;
    group?: number;
    games?: string[];
  }) {
    this.name = name;
    this.team_id = team_id;
    this.group = group;
    this.games = games;
  }
}
