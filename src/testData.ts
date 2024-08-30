import { TeamEntity } from './repositories/entities/TeamEntity';
import { Group, Team } from './models/Team';
import { Game, MatchPlan } from './models/Game';
import { v4 as uuid } from 'uuid';
import { bulkUpdate } from './repositories/TeamRepository';

interface Combination {
  teamIndex: number;
  opponentIndex: number;
  groupNumber: number;
  gameNumber: number;
  slot?: number;
}

export const buildTeamEntityFromTeam = (team: Team): TeamEntity =>
  new TeamEntity({ name: team.name, team_id: team.teamId, group: team.group });

export const buildGameFromTeams = (
  homeTeam: Team,
  awayTeam: Team,
  { number, group, slot, gameId }: { number: number; group: number; slot?: number; gameId?: string }
): Game => ({
  gameId: gameId ?? uuid(),
  number,
  group,
  slot,
  team: { teamId: homeTeam.teamId, name: homeTeam.name },
  opponent: { teamId: awayTeam.teamId, name: awayTeam.name },
});

export const buildUpdateFieldsFromGames = (team: Team, games: Game[], mockedDate?: string): bulkUpdate => ({
  team_id: team.teamId,
  updateFields: {
    games: games.map((game) => ({
      game_id: game.gameId,
      opponent: game.opponent,
      location: '',
      group: game.group,
      start: '',
      duration_in_minutes: 0,
      number: game.number,
      last_modified_at: mockedDate ?? new Date().toISOString(),
      slot: 1,
    })),
  },
});

export const removePropertyFromAllEntries = <T>(arr: T[], propertyName: keyof T): Omit<T, keyof T>[] => {
  return arr.map((entry) => removeProperty(entry, propertyName));
};

export const removeProperty = <T>(obj: T, propertyName: keyof T): Omit<T, keyof T> => {
  delete obj[propertyName];
  return obj;
};

export const buildMatchCombinations = (teams: Team[], combinations: Combination[], gameIds: string[] = []): MatchPlan =>
  combinations.map(({ teamIndex, opponentIndex, groupNumber, gameNumber, slot }, index) =>
    buildGameFromTeams(teams[teamIndex], teams[opponentIndex], {
      number: gameNumber,
      group: groupNumber,
      slot,
      gameId: gameIds[index],
    })
  );

export const buildGroupFromTeams = (teams: Team[], groupNumber: number): Group => ({ number: groupNumber, teams });

export const buildRandomTeams = (numberOfTeams: number): Team[] => {
  const teams: Team[] = [];
  while (teams.length < numberOfTeams) {
    teams.push({ name: `${teams.length}`, teamId: uuid() });
  }
  return teams;
};

export const teams: Team[] = [
  { name: 'one', teamId: '62eec995-bda0-47df-86cb-d412b25a8d03' },
  { name: 'two', teamId: '0272aa8a-3eca-41d8-9bbf-f165c34ab276' },
  { name: 'three', teamId: 'f27a4207-54cf-428e-a62a-01e914d6a75f' },
  { name: 'four', teamId: '358cad12-0a04-4b98-8790-f7a51b5ebd07' },
  { name: 'five', teamId: '354f48ca-7eea-4869-a084-d80601d1c050' },
  { name: 'six', teamId: '0b1ac01a-95fc-4bb6-895e-e7cdb802dbab' },
  { name: 'seven', teamId: 'b2d5c0d9-d696-4165-8933-c45c3548f6c3' },
  { name: 'eight', teamId: '6b9890de-7979-4713-a0ed-b385baa275c0' },
];

export const initialMatchCombinations: Record<number, Combination[]> = {
  0: [],
  1: [],
  2: [{ teamIndex: 0, opponentIndex: 1, groupNumber: 1, gameNumber: 1 }],
  3: [
    { teamIndex: 0, opponentIndex: 1, groupNumber: 1, gameNumber: 1 },
    { teamIndex: 1, opponentIndex: 2, groupNumber: 1, gameNumber: 2 },
    { teamIndex: 0, opponentIndex: 2, groupNumber: 1, gameNumber: 3 },
  ],
  4: [
    { teamIndex: 0, opponentIndex: 1, groupNumber: 1, gameNumber: 1 },
    { teamIndex: 2, opponentIndex: 3, groupNumber: 1, gameNumber: 2 },
    { teamIndex: 0, opponentIndex: 2, groupNumber: 1, gameNumber: 3 },
    { teamIndex: 1, opponentIndex: 3, groupNumber: 1, gameNumber: 4 },
    { teamIndex: 0, opponentIndex: 3, groupNumber: 1, gameNumber: 5 },
    { teamIndex: 1, opponentIndex: 2, groupNumber: 1, gameNumber: 6 },
  ],
  5: [
    { teamIndex: 0, opponentIndex: 1, groupNumber: 1, gameNumber: 1 },
    { teamIndex: 3, opponentIndex: 4, groupNumber: 1, gameNumber: 2 },
    { teamIndex: 0, opponentIndex: 2, groupNumber: 1, gameNumber: 3 },
    { teamIndex: 2, opponentIndex: 4, groupNumber: 1, gameNumber: 4 },
    { teamIndex: 0, opponentIndex: 3, groupNumber: 1, gameNumber: 5 },
    { teamIndex: 2, opponentIndex: 3, groupNumber: 1, gameNumber: 6 },
    { teamIndex: 0, opponentIndex: 4, groupNumber: 1, gameNumber: 7 },
    { teamIndex: 1, opponentIndex: 4, groupNumber: 1, gameNumber: 8 },
    { teamIndex: 1, opponentIndex: 2, groupNumber: 1, gameNumber: 9 },
    { teamIndex: 1, opponentIndex: 3, groupNumber: 1, gameNumber: 10 },
  ],
};

export const initialMatchCombinationsWithSlots: Record<number, Record<number, Combination[]>> = {
  0: {},
  1: {},
  2: {
    1: [
      { teamIndex: 0, opponentIndex: 1, groupNumber: 1, gameNumber: 1, slot: 1 },
      { teamIndex: 1, opponentIndex: 2, groupNumber: 1, gameNumber: 2, slot: 2 },
    ],
  },
  3: {
    1: [
      { teamIndex: 0, opponentIndex: 1, groupNumber: 1, gameNumber: 1, slot: 1 },
      { teamIndex: 1, opponentIndex: 2, groupNumber: 1, gameNumber: 2, slot: 2 },
      { teamIndex: 0, opponentIndex: 2, groupNumber: 1, gameNumber: 3, slot: 3 },
    ],
  },
  4: {
    1: [
      { teamIndex: 0, opponentIndex: 1, groupNumber: 1, gameNumber: 1, slot: 1 },
      { teamIndex: 2, opponentIndex: 3, groupNumber: 1, gameNumber: 2, slot: 2 },
      { teamIndex: 0, opponentIndex: 2, groupNumber: 1, gameNumber: 3, slot: 3 },
      { teamIndex: 1, opponentIndex: 3, groupNumber: 1, gameNumber: 4, slot: 4 },
      { teamIndex: 0, opponentIndex: 3, groupNumber: 1, gameNumber: 5, slot: 5 },
      { teamIndex: 1, opponentIndex: 2, groupNumber: 1, gameNumber: 6, slot: 6 },
    ],
    2: [
      { teamIndex: 0, opponentIndex: 1, groupNumber: 1, gameNumber: 1, slot: 1 },
      { teamIndex: 2, opponentIndex: 3, groupNumber: 1, gameNumber: 2, slot: 1 },
      { teamIndex: 0, opponentIndex: 2, groupNumber: 1, gameNumber: 3, slot: 2 },
      { teamIndex: 1, opponentIndex: 3, groupNumber: 1, gameNumber: 4, slot: 2 },
      { teamIndex: 0, opponentIndex: 3, groupNumber: 1, gameNumber: 5, slot: 3 },
      { teamIndex: 1, opponentIndex: 2, groupNumber: 1, gameNumber: 6, slot: 3 },
    ],
  },
  5: {
    1: [
      { teamIndex: 0, opponentIndex: 1, groupNumber: 1, gameNumber: 1, slot: 1 },
      { teamIndex: 3, opponentIndex: 4, groupNumber: 1, gameNumber: 2, slot: 2 },
      { teamIndex: 0, opponentIndex: 2, groupNumber: 1, gameNumber: 3, slot: 3 },
      { teamIndex: 2, opponentIndex: 4, groupNumber: 1, gameNumber: 4, slot: 4 },
      { teamIndex: 0, opponentIndex: 3, groupNumber: 1, gameNumber: 5, slot: 5 },
      { teamIndex: 2, opponentIndex: 3, groupNumber: 1, gameNumber: 6, slot: 6 },
      { teamIndex: 0, opponentIndex: 4, groupNumber: 1, gameNumber: 7, slot: 7 },
      { teamIndex: 1, opponentIndex: 4, groupNumber: 1, gameNumber: 8, slot: 8 },
      { teamIndex: 1, opponentIndex: 2, groupNumber: 1, gameNumber: 9, slot: 9 },
      { teamIndex: 1, opponentIndex: 3, groupNumber: 1, gameNumber: 10, slot: 10 },
    ],
    2: [
      { teamIndex: 0, opponentIndex: 1, groupNumber: 1, gameNumber: 1, slot: 1 },
      { teamIndex: 3, opponentIndex: 4, groupNumber: 1, gameNumber: 2, slot: 1 },

      { teamIndex: 0, opponentIndex: 2, groupNumber: 1, gameNumber: 3, slot: 2 },
      { teamIndex: 1, opponentIndex: 4, groupNumber: 1, gameNumber: 8, slot: 2 },

      { teamIndex: 2, opponentIndex: 4, groupNumber: 1, gameNumber: 4, slot: 3 },
      { teamIndex: 1, opponentIndex: 3, groupNumber: 1, gameNumber: 10, slot: 3 },

      { teamIndex: 2, opponentIndex: 3, groupNumber: 1, gameNumber: 6, slot: 4 },
      { teamIndex: 0, opponentIndex: 4, groupNumber: 1, gameNumber: 7, slot: 4 },

      { teamIndex: 1, opponentIndex: 2, groupNumber: 1, gameNumber: 9, slot: 5 },
      { teamIndex: 0, opponentIndex: 3, groupNumber: 1, gameNumber: 5, slot: 5 },
    ],
  },
};

// push [
// game: 1, slot: 1
// ]
// filter ids in slot and check if equal in game
// [0,1], [3,4]
// push [
// game: 1, slot: 1
// game: 2, slot: 1
// ]
// push [
// game: 1, slot: 1
// game: 2, slot: 1
// game: 3, slot: 2
// ]
// filter ids in slot and check if equal in game
// [0,2], [2,4]
// [0,2], [0,3]
// [0,2], [2,3]
// [0,2], [0,4]
// [0,2], [1,4] --> mark skipped!!
// push [
// game: 1, slot: 1
// game: 2, slot: 1
// game: 3, slot: 2
// game: 8, slot: 2
// ]
// push [
// game: 1, slot: 1
// game: 2, slot: 1
// game: 3, slot: 2
// game: 8, slot: 2
// game: 4, slot: 3
// ]
// filter ids in slot and check if equal in game
// [2,4], [0,3]
// push [
// game: 1, slot: 1
// game: 2, slot: 1
// game: 3, slot: 2
// game: 8, slot: 2
// game: 4, slot: 3
// game: 5, slot: 3
// ]
// push [
// game: 1, slot: 1
// game: 2, slot: 1
// game: 3, slot: 2
// game: 8, slot: 2
// game: 4, slot: 3
// game: 5, slot: 3
// game: 6, slot: 4
// ]
// filter ids in slot and check if equal in game
// [2,3], [0,4]
// push [
// game: 1, slot: 1
// game: 2, slot: 1
// game: 3, slot: 2
// game: 8, slot: 2
// game: 4, slot: 3
// game: 5, slot: 3
// game: 6, slot: 4
// game: 7, slot: 4
// ]
// push [
// game: 1, slot: 1
// game: 2, slot: 1
// game: 3, slot: 2
// game: 8, slot: 2
// game: 4, slot: 3
// game: 5, slot: 3
// game: 6, slot: 4
// game: 7, slot: 4
// game: 9, slot: 5
// ]
// filter ids in slot and check if equal in game
// [1,2], [1,3]
// find possible slot for [2,3]
// filter ids in slot and check if equal in swap possible
// slot 5: [1,2]
// slot 1: [[0,1],[3,4]] --> NO
// slot 2:

// swap [
// game: 1, slot: 1
// game: 2, slot: 1
// game: 3, slot: 2
// game: 8, slot: 2
// game: 4, slot: 3
// game: 5, slot: 3
// game: 6, slot: 4
// game: 7, slot: 4
// game: 9, slot: 5
// game: 10, slot: 5
// ]
