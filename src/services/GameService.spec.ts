import { TeamEntity } from '../repositories/entities/TeamEntity';
import {
  buildGameEntityFromGame,
  buildGameFromTeams,
  buildTeamEntityFromTeam,
  buildUpdateFieldsFromGames,
  removePropertyFromAllEntries,
  teams,
} from '../testData';
import { anything, instance, mock, objectContaining, verify, when } from 'ts-mockito';
import { TeamRepository } from '../repositories/TeamRepository';
import { MatchDistributionService } from './MatchDistributionService';
import { GameService } from './GameService';
import { GameRepository } from '../repositories/GameRepository';
import { GameSchedule } from '../models/Game';

describe('GameService', () => {
  let teamRepository: TeamRepository;
  let gameRepository: GameRepository;
  let matchDistributionService: MatchDistributionService;
  let gameService: GameService;

  beforeEach(() => {
    teamRepository = mock(TeamRepository);
    gameRepository = mock(GameRepository);

    matchDistributionService = mock(MatchDistributionService);

    gameService = new GameService(
      instance(matchDistributionService),
      instance(gameRepository),
      instance(teamRepository)
    );
  });

  describe('createGames', () => {
    const teamsInGroupOne: TeamEntity[] = [
      buildTeamEntityFromTeam(teams[0]),
      buildTeamEntityFromTeam(teams[1]),
      buildTeamEntityFromTeam(teams[2]),
    ];

    const gameOneOne = buildGameFromTeams(teams[0], teams[1], { group: 1, number: 1 });
    const gameOneTwo = buildGameFromTeams(teams[1], teams[2], { group: 1, number: 2 });
    const gameOneThree = buildGameFromTeams(teams[0], teams[2], { group: 1, number: 3 });

    const expectedUpdateFields = [
      buildUpdateFieldsFromGames(teams[0], [gameOneOne, gameOneThree]),
      buildUpdateFieldsFromGames(teams[1], [gameOneTwo]),
    ];

    test('to throw an error if no groups could be found and no teams available', () => {
      when(teamRepository.groupByGroupNumber()).thenResolve([]);
      when(teamRepository.findAll()).thenResolve([]);
      expect(gameService.createGames()).rejects.toThrow();
    });

    test('to throw an error if db could not be deleted', async () => {
      const matchPlan = [gameOneOne, gameOneTwo, gameOneThree];

      when(teamRepository.groupByGroupNumber()).thenResolve([{ number: 1, teams: teamsInGroupOne }]);
      when(matchDistributionService.generateOptimizedMatchPlan(anything())).thenReturn(matchPlan);
      when(gameRepository.wipeDatabase()).thenReject();
      expect(gameService.createGames()).rejects.toThrow();
    });

    test('to throw an error if games could not be inserted in db', async () => {
      const matchPlan = [gameOneOne, gameOneTwo, gameOneThree];

      when(teamRepository.groupByGroupNumber()).thenResolve([{ number: 1, teams: teamsInGroupOne }]);
      when(matchDistributionService.generateOptimizedMatchPlan(anything())).thenReturn(matchPlan);
      when(gameRepository.bulkInsert(anything())).thenReject();
      expect(gameService.createGames()).rejects.toThrow();
    });

    test('to throw an error if teams could not be updated in db', async () => {
      const matchPlan = [gameOneOne, gameOneTwo, gameOneThree];

      when(teamRepository.groupByGroupNumber()).thenResolve([{ number: 1, teams: teamsInGroupOne }]);
      when(matchDistributionService.generateOptimizedMatchPlan(anything())).thenReturn(matchPlan);
      when(teamRepository.bulkUpdate(anything())).thenReject();
      expect(gameService.createGames()).rejects.toThrow();
    });

    test('to setup initial match plan for one group and update team entities', async () => {
      const matchPlan = [gameOneOne, gameOneTwo, gameOneThree];

      when(teamRepository.groupByGroupNumber()).thenResolve([{ number: 1, teams: teamsInGroupOne }]);
      when(matchDistributionService.generateOptimizedMatchPlan(anything())).thenReturn(matchPlan);
      const result = await gameService.createGames();

      expect(result).toStrictEqual(matchPlan);
      verify(teamRepository.bulkUpdate(objectContaining(expectedUpdateFields))).once();
    });

    test('to setup initial match plan for two groups and update team entities', async () => {
      const teamsInGroupTwo: TeamEntity[] = [
        buildTeamEntityFromTeam(teams[3]),
        buildTeamEntityFromTeam(teams[4]),
        buildTeamEntityFromTeam(teams[5]),
      ];

      const gameTwoOne = buildGameFromTeams(teams[3], teams[4], { group: 2, number: 1 });
      const gameTwoTwo = buildGameFromTeams(teams[4], teams[5], { group: 2, number: 2 });
      const gameTwoThree = buildGameFromTeams(teams[3], teams[6], { group: 2, number: 3 });

      const matchPlan = [gameOneOne, gameTwoOne, gameOneTwo, gameTwoTwo, gameOneThree, gameTwoThree];

      const expectedUpdateFieldsTotal = [
        ...expectedUpdateFields,
        buildUpdateFieldsFromGames(teams[3], [gameTwoOne, gameTwoThree]),
        buildUpdateFieldsFromGames(teams[4], [gameTwoTwo]),
      ];

      when(teamRepository.groupByGroupNumber()).thenResolve([
        { number: 1, teams: teamsInGroupOne },
        { number: 2, teams: teamsInGroupTwo },
      ]);
      when(matchDistributionService.generateOptimizedMatchPlan(anything())).thenReturn(matchPlan);
      const result = await gameService.createGames();

      expect(result).toStrictEqual(matchPlan);
      verify(teamRepository.bulkUpdate(objectContaining(expectedUpdateFieldsTotal))).once();
    });
  });

  describe('scheduleGames', () => {
    const gameOneOne = buildGameFromTeams(teams[0], teams[1], { group: 1, number: 1 });
    const gameOneTwo = buildGameFromTeams(teams[1], teams[2], { group: 1, number: 2 });
    const gameOneThree = buildGameFromTeams(teams[0], teams[2], { group: 1, number: 3 });

    const games = [gameOneOne, gameOneTwo, gameOneThree];

    test('to throw error if no games available', async () => {
      when(gameRepository.sortByGroupAndNumber()).thenResolve([]);
      expect(gameService.scheduleGames(anything())).rejects.toThrow('Could not find any games');
    });

    test('to throw error if no teams available', async () => {
      when(gameRepository.sortByGroupAndNumber()).thenResolve(games.map(buildGameEntityFromGame));
      when(teamRepository.findAll()).thenResolve([]);
      expect(gameService.scheduleGames(anything())).rejects.toThrow('Could not find any teams');
    });

    test('to throw error if distributed match plan is invalid', async () => {
      when(gameRepository.sortByGroupAndNumber()).thenResolve(games.map(buildGameEntityFromGame));
      when(teamRepository.findAll()).thenResolve([teams[0], teams[1], teams[2]].map(buildTeamEntityFromTeam));
      when(matchDistributionService.distributeMatchSlots(anything(), anything())).thenThrow(new Error('Mocked error'));

      expect(gameService.scheduleGames(anything())).rejects.toThrow('Mocked error');
    });

    test('to throw error if game repository update fails', async () => {
      when(gameRepository.sortByGroupAndNumber()).thenResolve(games.map(buildGameEntityFromGame));
      when(teamRepository.findAll()).thenResolve([teams[0], teams[1], teams[2]].map(buildTeamEntityFromTeam));
      when(matchDistributionService.distributeMatchSlots(anything(), anything())).thenReturn([]);
      when(gameRepository.bulkUpdate(anything())).thenReject(new Error('Mocked error'));

      expect(gameService.scheduleGames(anything())).rejects.toThrow('Mocked error');
    });

    test('to schedule games on one pitch', async () => {
      const numberOfPitches = 1;
      const matchPlan = games.map((game) => ({ ...game, slot: numberOfPitches }));
      const expectedSchedule: GameSchedule[] = [
        {
          date: '2024-08-22',
          start: '12:00:00',
          durationInMinutes: 45,
          location: 'pitch bitch',
        },
        {
          date: '2024-08-22',
          start: '12:50:00',
          durationInMinutes: 45,
          location: 'pitch bitch',
        },
        {
          date: '2024-08-22',
          start: '13:40:00',
          durationInMinutes: 45,
          location: 'pitch bitch',
        },
      ];
      const scheduledMatchPlan = matchPlan.map((game, index) => ({ ...game, schedule: expectedSchedule[index] }));

      when(gameRepository.sortByGroupAndNumber()).thenResolve(games.map(buildGameEntityFromGame));
      when(teamRepository.findAll()).thenResolve([teams[0], teams[1], teams[2]].map(buildTeamEntityFromTeam));
      when(matchDistributionService.distributeMatchSlots(anything(), numberOfPitches)).thenReturn(matchPlan);
      when(gameRepository.bulkUpdate(anything())).thenResolve();

      const result = await gameService.scheduleGames({
        numberOfPitches,
        date: '2024-08-22T10:00:00.000Z',
        location: 'pitch bitch',
        playTimeInMinutes: 45,
        breakBetweenInMinutes: 5,
      });

      expect(removePropertyFromAllEntries(result, 'gameId')).toStrictEqual(
        removePropertyFromAllEntries(scheduledMatchPlan, 'gameId')
      );
    });

    test('to schedule games on two pitches', async () => {
      const numberOfPitches = 2;
      const slots = [1, 1, 2];
      const matchPlan = games.map((game, index) => ({ ...game, slot: slots[index] }));
      const expectedSchedule: GameSchedule[] = [
        {
          date: '2024-08-22',
          start: '12:00:00',
          durationInMinutes: 45,
          location: 'pitch bitch',
        },
        {
          date: '2024-08-22',
          start: '12:00:00',
          durationInMinutes: 45,
          location: 'pitch bitch',
        },
        {
          date: '2024-08-22',
          start: '12:50:00',
          durationInMinutes: 45,
          location: 'pitch bitch',
        },
      ];
      const scheduledMatchPlan = matchPlan.map((game, index) => ({ ...game, schedule: expectedSchedule[index] }));

      when(gameRepository.sortByGroupAndNumber()).thenResolve(games.map(buildGameEntityFromGame));
      when(teamRepository.findAll()).thenResolve([teams[0], teams[1], teams[2]].map(buildTeamEntityFromTeam));
      when(matchDistributionService.distributeMatchSlots(anything(), numberOfPitches)).thenReturn(matchPlan);
      when(gameRepository.bulkUpdate(anything())).thenResolve();

      const result = await gameService.scheduleGames({
        numberOfPitches,
        date: '2024-08-22T10:00:00.000Z',
        location: 'pitch bitch',
        playTimeInMinutes: 45,
        breakBetweenInMinutes: 5,
      });

      expect(removePropertyFromAllEntries(result, 'gameId')).toStrictEqual(
        removePropertyFromAllEntries(scheduledMatchPlan, 'gameId')
      );
    });
  });
});
