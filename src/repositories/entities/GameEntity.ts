import { ObjectId } from 'mongodb';
import { v4 as uuid } from 'uuid';
import { GameSchedule } from '../../models/Game';

export class GameEntity {
  public _id?: ObjectId;
  public game_id: string;
  public game_number: number;
  public group: number;
  public team: string;
  public opponent: string;
  public last_modified: string;
  public slot: number;
  public schedule: GameSchedule;

  constructor({
    game_id = uuid(),
    game_number,
    group,
    team,
    opponent,
    last_modified = new Date().toISOString(),
    slot,
    schedule,
  }: {
    game_id: string;
    game_number: number;
    group: number;
    team: string;
    opponent: string;
    last_modified: string;
    slot: number;
    schedule: GameSchedule;
  }) {
    this.game_id = game_id;
    this.game_number = game_number;
    this.group = group;
    this.team = team;
    this.opponent = opponent;
    this.last_modified = last_modified;
    this.slot = slot;
    this.schedule = schedule;
  }
}
