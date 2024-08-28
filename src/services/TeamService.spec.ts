import { TeamRepository } from '../repositories/TeamRepository';
import { anything, deepEqual, instance, mock, objectContaining, verify, when } from 'ts-mockito';
import { TeamService, TeamServiceError } from './TeamService';
import { buildGameFromTeams, buildTeamEntityFromTeam, buildUpdateFieldsFromGames, teams } from '../testData';
import { Group } from '../models/Team';
import { MatchScheduleService } from './MatchScheduleService';
import { TeamEntity } from '../repositories/entities/TeamEntity';
import { MatchDistributionService } from './MatchDistributionService';

describe('TeamService', () => {
  let teamRepository: TeamRepository;
  let teamService: TeamService;
  let matchScheduleService: MatchScheduleService;
  let matchDistributionService: MatchDistributionService;
  const teamEntities = teams.map(buildTeamEntityFromTeam);

  beforeEach(() => {
    teamRepository = mock(TeamRepository);
    matchScheduleService = mock(MatchScheduleService);
    teamService = new TeamService(instance(teamRepository), instance(matchScheduleService));
    matchDistributionService = mock(MatchDistributionService);
    teamService = new TeamService(
      instance(teamRepository),
      instance(matchScheduleService),
      instance(matchDistributionService),
    );
  });

  describe('listTeams', () => {
    test('to list all teams without query', async () => {
      const expectedTeams = [teams[0], teams[1]];
      const teamEntities = expectedTeams.map(buildTeamEntityFromTeam);
      when(teamRepository.findAll(undefined)).thenResolve(teamEntities);

      const result = await teamService.listTeams();
      expect(result).toEqual(expectedTeams);
    });

    test('to list all teams valid query', async () => {
      const expectedTeam = { ...teams[0], group: 1 };
      const query = { group: expectedTeam.group };
      const teamEntity = buildTeamEntityFromTeam(expectedTeam);
      when(teamRepository.findAll(deepEqual(query))).thenResolve([teamEntity]);

      const result = await teamService.listTeams(query);
      expect(result).toEqual([expectedTeam]);
    });
  });

  describe('shuffleGroups', () => {
    test('to return only one group if desired number of groups equals one', async () => {
      const numberOfGroups = 1;
      when(teamRepository.findAll()).thenResolve(teamEntities);
      const result = await teamService.shuffleGroups({ numberOfGroups });
      expect(result).toEqual([{ number: 1, teams: teams }]);
    });

    test('to split teams into two groups if desired number of groups equals two', async () => {
      const expectedGroups: Group[] = [
        { number: 1, teams: teams.slice(0, 4) },
        { number: 2, teams: teams.slice(4) },
      ];
      const numberOfGroups = 2;
      when(teamRepository.findAll()).thenResolve(teamEntities);
      const result = await teamService.shuffleGroups({ numberOfGroups });
      expect(result.length).toBe(2);
      expect(result).toStrictEqual(expectedGroups);
    });

    test('to split teams into three groups with remainder if desired number of groups equals three', async () => {
      const expectedGroups: Group[] = [
        { number: 1, teams: teams.slice(0, 3) },
        { number: 2, teams: teams.slice(3, 6) },
        { number: 3, teams: teams.slice(6) },
      ];
      const numberOfGroups = 3;
      when(teamRepository.findAll()).thenResolve(teamEntities);
      const result = await teamService.shuffleGroups({ numberOfGroups });
      expect(result.length).toBe(3);
      expect(result).toStrictEqual(expectedGroups);
    });
  });

  describe('generateMatchPlan', () => {
    const mockedLastModified = '2000-01-01T00:00:00.000Z';
    beforeEach(() => {
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(mockedLastModified);
    });

    afterEach(() => {
      jest.resetAllMocks();
    });
    const teamsInGroupOne: TeamEntity[] = [
      buildTeamEntityFromTeam(teams[0]),
      buildTeamEntityFromTeam(teams[1]),
      buildTeamEntityFromTeam(teams[2]),
    ];

    const gameOneOne = buildGameFromTeams(teams[0], teams[1], { group: 1, number: 1 });
    const gameOneTwo = buildGameFromTeams(teams[1], teams[2], { group: 1, number: 2 });
    const gameOneThree = buildGameFromTeams(teams[0], teams[2], { group: 1, number: 3 });

    const expectedUpdateFields = [
      buildUpdateFieldsFromGames(teams[0], [gameOneOne, gameOneThree], mockedLastModified),
      buildUpdateFieldsFromGames(teams[1], [gameOneTwo], mockedLastModified),
    ];
    test('to throw an error if no groups could be found', () => {
      when(teamRepository.groupByGroupNumber()).thenResolve([]);
      expect(teamService.generateMatchPlan()).rejects.toThrow(TeamServiceError.GroupingFailed);
    });

    test('to setup initial match plan for one group and update team entities', async () => {
      const matchPlan = [gameOneOne, gameOneTwo, gameOneThree];

      when(teamRepository.groupByGroupNumber()).thenResolve([{ number: 1, teams: teamsInGroupOne }]);

      when(matchScheduleService.setupMatchPlan(anything())).thenReturn(matchPlan);
      const result = await teamService.generateMatchPlan();

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
        buildUpdateFieldsFromGames(teams[3], [gameTwoOne, gameTwoThree], mockedLastModified),
        buildUpdateFieldsFromGames(teams[4], [gameTwoTwo], mockedLastModified),
      ];

      when(teamRepository.groupByGroupNumber()).thenResolve([
        { number: 1, teams: teamsInGroupOne },
        { number: 2, teams: teamsInGroupTwo },
      ]);

      when(matchScheduleService.setupMatchPlan(anything())).thenReturn(matchPlan);
      const result = await teamService.generateMatchPlan();

      expect(result).toStrictEqual(matchPlan);
      verify(teamRepository.bulkUpdate(objectContaining(expectedUpdateFieldsTotal))).once();
    });
  });
});
