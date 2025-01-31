import { ObjectId } from 'mongodb';
import { v4 as uuid } from 'uuid';
import { GameSchedule } from '../../models/GameSchedule';

export class GameEntity {
  public _id?: ObjectId;
  public game_id: string;
  public game_number: number;
  public group: number;
  public home_team: string;
  public away_team: string;
  public created: string;
  public last_modified: string;
  public schedule: GameSchedule;

  constructor({
    game_id = uuid(),
    game_number,
    group,
    home_team,
    away_team,
    created,
    last_modified = new Date().toISOString(),
    schedule,
  }: {
    game_id: string;
    game_number: number;
    group: number;
    home_team: string;
    away_team: string;
    created: string;
    last_modified: string;
    schedule: GameSchedule;
  }) {
    this.game_id = game_id;
    this.game_number = game_number;
    this.group = group;
    this.home_team = home_team;
    this.away_team = away_team;
    this.created = created;
    this.last_modified = last_modified;
    this.schedule = schedule;
  }
}
