// export type GameType = 'home' | 'away';
// export type GameState = 'group';

import { Team } from './Team';

export type TeamInfo = Pick<Team, 'teamId' | 'name'>;

export interface Game {
  gameId: string;
  number: number;
  group: number;
  team: TeamInfo;
  opponent: TeamInfo;
  slot?: number;
  start?: string;
  location?: string;
  durationInMinutes?: number;
}

export type MatchPlan = Game[];
