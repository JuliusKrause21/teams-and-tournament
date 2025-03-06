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
import { GameService, GameServiceError } from './GameService';
import { GameRepository } from '../repositories/GameRepository';
import { GameSchedule } from '../models/Game';
import { err, ok } from 'neverthrow';
import { MatchValidationService, ValidationMessage } from './MatchValidationService';

describe('GameService', () => {
  let teamRepository: TeamRepository;
  let gameRepository: GameRepository;
  let matchDistributionService: MatchDistributionService;
  let matchValidationService: MatchValidationService;
  let gameService: GameService;

  beforeEach(() => {
    teamRepository = mock(TeamRepository);
    gameRepository = mock(GameRepository);
    matchValidationService = mock(MatchValidationService);
    matchDistributionService = mock(MatchDistributionService);

    gameService = new GameService(
      instance(matchDistributionService),
      instance(matchValidationService),
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

    const mockedErrorMessage = 'This is an error';

    test('to return an error if no reading groups from the db fails', async () => {
      when(teamRepository.groupByGroupNumber()).thenResolve(err(new Error(mockedErrorMessage)));
      const result = await gameService.createGames();
      expect(result).toEqual(err(new Error(mockedErrorMessage)));
    });

    test('to return an error if match plan validation fails', async () => {
      const matchPlan = [gameOneOne, gameOneTwo, gameOneThree];
      when(teamRepository.groupByGroupNumber()).thenResolve(ok([{ number: 1, teams: teamsInGroupOne }]));
      when(matchDistributionService.generateOptimizedMatchPlan(anything())).thenReturn(matchPlan);
      when(matchValidationService.validateMatchPlan(matchPlan)).thenReturn([
        { message: ValidationMessage.InvalidCombinationOfTeams, group: 1, games: [gameOneOne] },
      ]);

      const result = await gameService.createGames();
      expect(result).toEqual(err(new Error(GameServiceError.InvalidMatchPlan)));
    });

    test('to return an error if db could not be deleted', async () => {
      const matchPlan = [gameOneOne, gameOneTwo, gameOneThree];

      when(teamRepository.groupByGroupNumber()).thenResolve(ok([{ number: 1, teams: teamsInGroupOne }]));
      when(matchDistributionService.generateOptimizedMatchPlan(anything())).thenReturn(matchPlan);
      when(matchValidationService.validateMatchPlan(matchPlan)).thenReturn([]);
      when(gameRepository.wipeDatabase()).thenResolve(err(new Error(mockedErrorMessage)));

      const result = await gameService.createGames();
      expect(result).toEqual(err(new Error(mockedErrorMessage)));
    });

    test('to return an error if games could not be inserted in db', async () => {
      const matchPlan = [gameOneOne, gameOneTwo, gameOneThree];

      when(teamRepository.groupByGroupNumber()).thenResolve(ok([{ number: 1, teams: teamsInGroupOne }]));
      when(matchDistributionService.generateOptimizedMatchPlan(anything())).thenReturn(matchPlan);
      when(matchValidationService.validateMatchPlan(matchPlan)).thenReturn([]);
      when(gameRepository.wipeDatabase()).thenResolve(ok(undefined));
      when(gameRepository.bulkInsert(anything())).thenResolve(err(new Error(mockedErrorMessage)));

      const result = await gameService.createGames();
      expect(result).toEqual(err(new Error(mockedErrorMessage)));
    });

    test('to return an error if teams could not be updated in db', async () => {
      const matchPlan = [gameOneOne, gameOneTwo, gameOneThree];

      when(teamRepository.groupByGroupNumber()).thenResolve(ok([{ number: 1, teams: teamsInGroupOne }]));
      when(matchDistributionService.generateOptimizedMatchPlan(anything())).thenReturn(matchPlan);
      when(matchValidationService.validateMatchPlan(matchPlan)).thenReturn([]);
      when(gameRepository.wipeDatabase()).thenResolve(ok(undefined));
      when(gameRepository.bulkInsert(anything())).thenResolve(ok(undefined));
      when(teamRepository.bulkUpdate(anything())).thenResolve(err(new Error(mockedErrorMessage)));

      const result = await gameService.createGames();
      expect(result).toEqual(err(new Error(mockedErrorMessage)));
    });

    test('to setup initial match plan for one group and update team entities', async () => {
      const matchPlan = [gameOneOne, gameOneTwo, gameOneThree];

      when(teamRepository.groupByGroupNumber()).thenResolve(ok([{ number: 1, teams: teamsInGroupOne }]));
      when(matchDistributionService.generateOptimizedMatchPlan(anything())).thenReturn(matchPlan);
      when(matchValidationService.validateMatchPlan(matchPlan)).thenReturn([]);
      when(gameRepository.wipeDatabase()).thenResolve(ok(undefined));
      when(gameRepository.bulkInsert(anything())).thenResolve(ok(undefined));
      when(teamRepository.bulkUpdate(anything())).thenResolve(ok(undefined));

      const result = await gameService.createGames();

      expect(result).toStrictEqual(ok(matchPlan));
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

      when(teamRepository.groupByGroupNumber()).thenResolve(
        ok([
          { number: 1, teams: teamsInGroupOne },
          { number: 2, teams: teamsInGroupTwo },
        ])
      );
      when(matchDistributionService.generateOptimizedMatchPlan(anything())).thenReturn(matchPlan);
      when(matchValidationService.validateMatchPlan(matchPlan)).thenReturn([]);
      when(gameRepository.wipeDatabase()).thenResolve(ok(undefined));
      when(gameRepository.bulkInsert(anything())).thenResolve(ok(undefined));
      when(teamRepository.bulkUpdate(anything())).thenResolve(ok(undefined));

      const result = await gameService.createGames();

      expect(result).toStrictEqual(ok(matchPlan));
      verify(teamRepository.bulkUpdate(objectContaining(expectedUpdateFieldsTotal))).once();
    });
  });

  describe('scheduleGames', () => {
    const gameOneOne = buildGameFromTeams(teams[0], teams[1], { group: 1, number: 1 });
    const gameOneTwo = buildGameFromTeams(teams[1], teams[2], { group: 1, number: 2 });
    const gameOneThree = buildGameFromTeams(teams[0], teams[2], { group: 1, number: 3 });

    const games = [gameOneOne, gameOneTwo, gameOneThree];

    const mockedErrorMessage = 'Mocked error message';

    test('to return an error if games aggregation fails', async () => {
      when(gameRepository.sortByGroupAndNumber()).thenResolve(err(new Error(mockedErrorMessage)));
      const result = await gameService.scheduleGames(anything());
      expect(result).toEqual(err(new Error(mockedErrorMessage)));
    });

    test('to return an error if finding teams in db fails', async () => {
      when(gameRepository.sortByGroupAndNumber()).thenResolve(ok(games.map(buildGameEntityFromGame)));
      when(teamRepository.findAll()).thenResolve(err(new Error(mockedErrorMessage)));
      const result = await gameService.scheduleGames(anything());
      expect(result).toEqual(err(new Error(mockedErrorMessage)));
    });

    test('to return an error if no games in db', async () => {
      when(gameRepository.sortByGroupAndNumber()).thenResolve(ok([]));
      when(teamRepository.findAll()).thenResolve(ok([teams[0], teams[1], teams[2]].map(buildTeamEntityFromTeam)));
      const result = await gameService.scheduleGames(anything());
      expect(result).toEqual(err(new Error(GameServiceError.NoGamesFound)));
    });

    test('to return an error if no teams in db', async () => {
      when(gameRepository.sortByGroupAndNumber()).thenResolve(ok(games.map(buildGameEntityFromGame)));
      when(teamRepository.findAll()).thenResolve(ok([]));
      const result = await gameService.scheduleGames(anything());
      expect(result).toEqual(err(new Error(GameServiceError.NoTeamsFound)));
    });

    test('to return an error if distributed match plan is invalid', async () => {
      when(gameRepository.sortByGroupAndNumber()).thenResolve(ok(games.map(buildGameEntityFromGame)));
      when(teamRepository.findAll()).thenResolve(ok([teams[0], teams[1], teams[2]].map(buildTeamEntityFromTeam)));
      when(matchDistributionService.distributeMatchSlots(anything(), anything())).thenThrow(new Error('Mocked error'));

      const result = await gameService.scheduleGames(anything());
      expect(result).toEqual(err(new Error(GameServiceError.MatchPlanDistributionFailed)));
    });

    test('to return an error if game repository update fails', async () => {
      when(gameRepository.sortByGroupAndNumber()).thenResolve(ok(games.map(buildGameEntityFromGame)));
      when(teamRepository.findAll()).thenResolve(ok([teams[0], teams[1], teams[2]].map(buildTeamEntityFromTeam)));
      when(matchDistributionService.distributeMatchSlots(anything(), anything())).thenReturn([]);
      when(matchValidationService.validateMatchPlan(anything())).thenReturn([]);
      when(gameRepository.bulkUpdate(anything())).thenResolve(err(new Error(mockedErrorMessage)));

      const result = await gameService.scheduleGames(anything());
      expect(result).toEqual(err(new Error(mockedErrorMessage)));
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

      when(gameRepository.sortByGroupAndNumber()).thenResolve(ok(games.map(buildGameEntityFromGame)));
      when(teamRepository.findAll()).thenResolve(ok([teams[0], teams[1], teams[2]].map(buildTeamEntityFromTeam)));
      when(matchDistributionService.distributeMatchSlots(anything(), numberOfPitches)).thenReturn(matchPlan);
      when(matchValidationService.validateMatchPlan(matchPlan)).thenReturn([]);
      when(gameRepository.bulkUpdate(anything())).thenResolve(ok(undefined));

      const result = await gameService.scheduleGames({
        numberOfPitches,
        date: '2024-08-22T10:00:00.000Z',
        location: 'pitch bitch',
        playTimeInMinutes: 45,
        breakBetweenInMinutes: 5,
      });

      expect(removePropertyFromAllEntries(result._unsafeUnwrap(), 'gameId')).toStrictEqual(
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

      when(gameRepository.sortByGroupAndNumber()).thenResolve(ok(games.map(buildGameEntityFromGame)));
      when(teamRepository.findAll()).thenResolve(ok([teams[0], teams[1], teams[2]].map(buildTeamEntityFromTeam)));
      when(matchDistributionService.distributeMatchSlots(anything(), numberOfPitches)).thenReturn(matchPlan);
      when(matchValidationService.validateMatchPlan(matchPlan)).thenReturn([]);
      when(gameRepository.bulkUpdate(anything())).thenResolve(ok(undefined));

      const result = await gameService.scheduleGames({
        numberOfPitches,
        date: '2024-08-22T10:00:00.000Z',
        location: 'pitch bitch',
        playTimeInMinutes: 45,
        breakBetweenInMinutes: 5,
      });

      expect(removePropertyFromAllEntries(result._unsafeUnwrap(), 'gameId')).toStrictEqual(
        removePropertyFromAllEntries(scheduledMatchPlan, 'gameId')
      );
    });
  });
});
