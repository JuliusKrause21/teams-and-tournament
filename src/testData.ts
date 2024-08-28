import { TeamEntity } from './repositories/entities/TeamEntity';
import { Group, Team } from './models/Team';
import { Game, MatchPlan } from './models/Game';
import { v4 as uuid } from 'uuid';
import { bulkUpdate } from './repositories/TeamRepository';

export const buildTeamEntityFromTeam = (team: Team): TeamEntity =>
  new TeamEntity({ name: team.name, team_id: team.teamId, group: team.group });

export const buildGameFromTeams = (
  homeTeam: Team,
  awayTeam: Team,
  { number, group, slot }: { number: number; group: number; slot?: number }
): Game => ({
  gameId: uuid(),
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

export const buildMatchCombinations = (
  teams: Team[],
  combinations: { teamIndex: number; opponentIndex: number; groupNumber: number; gameNumber: number; slot?: number }[]
): MatchPlan =>
  combinations.map(({ teamIndex, opponentIndex, groupNumber, gameNumber, slot }) =>
    buildGameFromTeams(teams[teamIndex], teams[opponentIndex], {
      number: gameNumber,
      group: groupNumber,
      slot,
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
