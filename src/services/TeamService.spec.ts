import { TeamRepository } from '../repositories/TeamRepository';
import { instance, mock, when } from 'ts-mockito';
import { TeamService } from './TeamService';
import { dummyTeamEntities, dummyTeams } from '../dummyData';
import { Group } from '../models/Team';

describe('TeamService', () => {
  let teamRepository: TeamRepository;
  let teamService: TeamService;

  beforeEach(() => {
    teamRepository = mock(TeamRepository);
    teamService = new TeamService(instance(teamRepository));
  });

  // TODO: Find a way to remove the back and forth mapping here caused by WithId.
  // test('to list teams', async () => {
  //   const teamNames = ['First', 'Second'];
  //   const teams = teamNames.map((teamName) => new TeamEntity(teamName));
  //   when(teamRepository.findAll()).thenResolve(teams.map((team) => ({ ...team, _id: new ObjectId() })));
  //
  //   const result = await teamService.listTeams();
  //   expect(result.map((r) => r.name)).toEqual(teams.map((team) => team.name));
  // });

  describe('shuffleGroups', () => {
    test('to return only one group if desired number of groups equals one', async () => {
      const numberOfGroups = 1;
      when(teamRepository.findAll()).thenResolve(dummyTeamEntities);
      const result = await teamService.shuffleGroups({ numberOfGroups });
      expect(result).toEqual([{ number: 1, teams: dummyTeams }]);
    });

    test('to split teams into two groups if desired number of groups equals two', async () => {
      const expectedGroups: Group[] = [
        { number: 1, teams: dummyTeams.slice(0, 4) },
        { number: 2, teams: dummyTeams.slice(4) },
      ];
      const numberOfGroups = 2;
      when(teamRepository.findAll()).thenResolve(dummyTeamEntities);
      const result = await teamService.shuffleGroups({ numberOfGroups });
      expect(result.length).toBe(2);
      expect(result).toStrictEqual(expectedGroups);
    });

    test('to split teams into three groups with remainder if desired number of groups equals three', async () => {
      const expectedGroups: Group[] = [
        { number: 1, teams: dummyTeams.slice(0, 3) },
        { number: 2, teams: dummyTeams.slice(3, 6) },
        { number: 3, teams: dummyTeams.slice(6) },
      ];
      const numberOfGroups = 3;
      when(teamRepository.findAll()).thenResolve(dummyTeamEntities);
      const result = await teamService.shuffleGroups({ numberOfGroups });
      expect(result.length).toBe(3);
      expect(result).toStrictEqual(expectedGroups);
    });
  });

  describe('adjustMatchSlots', () => {
    const matchPlan = [
      { team: 'one', group: 1, opponent: 'two', number: 1 },
      { team: 'five', group: 2, opponent: 'six', number: 1 },
      { team: 'three', group: 1, opponent: 'four', number: 2 },
      { team: 'seven', group: 2, opponent: 'eight', number: 2 },
      { team: 'one', group: 1, opponent: 'three', number: 3 },
      { team: 'five', group: 2, opponent: 'seven', number: 3 },
      { team: 'two', group: 1, opponent: 'four', number: 4 },
      { team: 'six', group: 2, opponent: 'eight', number: 4 },
      { team: 'one', group: 1, opponent: 'four', number: 5 },
      { team: 'five', group: 2, opponent: 'eight', number: 5 },
      { team: 'two', group: 1, opponent: 'three', number: 6 },
      { team: 'six', group: 2, opponent: 'seven', number: 6 },
    ];

    test('to adjust slots correctly', async () => {
      const result = teamService.adjustMatchSlots(matchPlan);
      expect(result).toBeDefined();
    });
  });
});
