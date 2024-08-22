import { TaskType } from './models/Task';
import { TaskEntity } from './repositories/entities/TaskEntity';
import { Team } from './models/Team';
import { TeamEntity } from './repositories/entities/TeamEntity';

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
  numberOfPitches: 2,
};

export const dummyTeamEntities: TeamEntity[] = [
  { name: 'one', team_id: '62eec995-bda0-47df-86cb-d412b25a8d03', matches: [] },
  { name: 'two', team_id: '0272aa8a-3eca-41d8-9bbf-f165c34ab276', matches: [] },
  { name: 'three', team_id: 'f27a4207-54cf-428e-a62a-01e914d6a75f', matches: [] },
  { name: 'four', team_id: '358cad12-0a04-4b98-8790-f7a51b5ebd07', matches: [] },
  { name: 'five', team_id: '354f48ca-7eea-4869-a084-d80601d1c050', matches: [] },
  { name: 'six', team_id: '0b1ac01a-95fc-4bb6-895e-e7cdb802dbab', matches: [] },
  { name: 'seven', team_id: 'b2d5c0d9-d696-4165-8933-c45c3548f6c3', matches: [] },
  { name: 'eight', team_id: '6b9890de-7979-4713-a0ed-b385baa275c0', matches: [] },
];

export const dummyTeams: Team[] = [
  { name: 'one', teamId: '62eec995-bda0-47df-86cb-d412b25a8d03' },
  { name: 'two', teamId: '0272aa8a-3eca-41d8-9bbf-f165c34ab276' },
  { name: 'three', teamId: 'f27a4207-54cf-428e-a62a-01e914d6a75f' },
  { name: 'four', teamId: '358cad12-0a04-4b98-8790-f7a51b5ebd07' },
  { name: 'five', teamId: '354f48ca-7eea-4869-a084-d80601d1c050' },
  { name: 'six', teamId: '0b1ac01a-95fc-4bb6-895e-e7cdb802dbab' },
  { name: 'seven', teamId: 'b2d5c0d9-d696-4165-8933-c45c3548f6c3' },
  { name: 'eight', teamId: '6b9890de-7979-4713-a0ed-b385baa275c0' },
];
