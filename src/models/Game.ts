// export type GameType = 'home' | 'away';
// export type GameState = 'group';

import { TeamInfo } from './Team';

export interface GameScheduleOptions {
  numberOfPitches?: number;
  date?: string;
  location?: string;
  playTimeInMinutes?: number;
  breakBetweenInMinutes?: number;
}

export interface GameSchedule {
  date?: string;
  start?: string;
  location?: string;
  durationInMinutes?: number;
}

export interface Game {
  gameId: string;
  number: number;
  group: number;
  team: TeamInfo;
  opponent: TeamInfo;
  slot?: number;
  schedule?: GameSchedule;
}

export type MatchPlan = Game[];
