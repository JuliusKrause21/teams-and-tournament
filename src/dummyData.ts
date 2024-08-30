import { TaskType } from './models/Task';
import { TaskEntity } from './repositories/entities/TaskEntity';

export const gameDate = '2024-09-02T08:19:34.277Z';

export const games: Game[] = [
  {
    id: '1',
    date: gameDate,
    type: 'home',
    availablePlayers: ['Julius', 'Moritz', 'Kimberly'],
  },
];

export interface Game {
  id: string;
  date: string;
  type: string;
  availablePlayers: string[];
}

export enum Condition {
  HomeGame = 'home',
  AwayGame = 'away',
}

export type DefaultTasks = Record<Condition, Pick<TaskEntity, 'type' | 'description' | 'number_of_needs'>[]>;

export const defaultTasks: DefaultTasks = {
  [Condition.HomeGame]: [
    {
      type: TaskType.Simple,
      description: 'Trikots waschen',
      number_of_needs: 1,
    },
    {
      type: TaskType.Simple,
      description: 'Kampfgericht',
      number_of_needs: 1,
    },
    {
      type: TaskType.Simple,
      description: 'Kuchen',
      number_of_needs: 2,
    },
  ],
  [Condition.AwayGame]: [
    {
      type: TaskType.Simple,
      description: 'Trikots waschen',
      number_of_needs: 1,
    },
    {
      type: TaskType.Complex,
      description: 'Fahren',
      number_of_needs: 5,
    },
  ],
};

export interface Player {
  name: string;
  available: string[];
}

export const players: Player[] = [
  {
    name: 'Julius',
    available: [],
  },
  {
    name: 'Moritz',
    available: [],
  },
];

export const scheduleConfig = {
  startTime: '2024-08-22T10:00:00.000Z',
  playTime: 25,
  breakBetweenMatches: 5,
  numberOfPitches: 1,
};
