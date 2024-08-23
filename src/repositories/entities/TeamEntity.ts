import { ObjectId } from 'mongodb';
import { v4 as uuid } from 'uuid';
import { TeamInfo } from '../../models/Game';

export interface GameEntity {
  game_id: string;
  start: string;
  opponent: TeamInfo;
  location: string;
  number: number;
  group: number;
  slot: number;
  duration_in_minutes: number;
  last_modified_at: string;
}

export class TeamEntity {
  public _id?: ObjectId;
  public name: string;
  public team_id?: string;
  public group?: number;
  public games?: GameEntity[];

  constructor({
    name,
    team_id = uuid(),
    group,
    games = [],
  }: {
    name: string;
    team_id?: string;
    group?: number;
    games?: GameEntity[];
  }) {
    this.name = name;
    this.team_id = team_id;
    this.group = group;
    this.games = games;
  }
}
