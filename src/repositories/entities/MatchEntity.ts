import { ObjectId } from 'mongodb';
import { v4 as uuid } from 'uuid';

export class MatchEntity {
  public _id?: ObjectId;
  public day: string;
  public date: string;
  public match_id: string;
  public home_team: string;
  public away_team: string;
  public location: string;
  public last_modified: string;
  public available_players: string[];
  public match_number?: string;
  constructor({
    day,
    date,
    match_id = uuid(),
    match_number,
    home_team,
    away_team,
    location,
    last_modified = new Date().toISOString(),
    available_players = [],
  }: {
    day: string;
    date: string;
    home_team: string;
    away_team: string;
    location: string;
    match_id?: string;
    match_number?: string;
    last_modified?: string;
    available_players?: string[];
  }) {
    this.day = day;
    this.date = date;
    this.match_id = match_id;
    this.match_number = match_number;
    this.home_team = home_team;
    this.away_team = away_team;
    this.location = location;
    this.last_modified = last_modified;
    this.available_players = available_players;
  }
}
