import { ObjectId } from 'mongodb';
import { v4 as uuid } from 'uuid';

type GameType = 'home' | 'away';
type GameState = 'group';

export interface Game {
  game_id: string;
  time: string;
  opponent: string;
  pitch: string;
  type: GameType;
  state: GameState;
}

export class TeamEntity {
  public _id?: ObjectId;
  public name: string;
  public team_id?: string;
  public group?: number;
  public matches: Game[];

  constructor({
    name,
    team_id = uuid(),
    group,
    matches = [],
  }: {
    name: string;
    team_id?: string;
    group?: number;
    matches: Game[];
  }) {
    this.name = name;
    this.team_id = team_id;
    this.group = group;
    this.matches = matches;
  }
}
