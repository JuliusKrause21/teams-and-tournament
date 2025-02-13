import { TeamRepository } from '../repositories/TeamRepository';
import { deepEqual, instance, mock, when } from 'ts-mockito';
import { TeamService } from './TeamService';
import { buildTeamEntityFromTeam, teams } from '../testData';

describe('TeamService', () => {
  let teamRepository: TeamRepository;
  let teamService: TeamService;

  const teamEntities = teams.map(buildTeamEntityFromTeam);

  beforeEach(() => {
    teamRepository = mock(TeamRepository);
    teamService = new TeamService(instance(teamRepository));
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
      expect(result.length).toEqual(1);
      expect(result.every((group) => group.teams.length === teams.length)).toBe(true);
    });

    test('to split teams into two groups if desired number of groups equals two', async () => {
      const numberOfGroups = 2;
      when(teamRepository.findAll()).thenResolve(teamEntities);
      const result = await teamService.shuffleGroups({ numberOfGroups });
      expect(result.length).toBe(2);
      expect(result.every((group) => group.teams.length === 4)).toBe(true);
    });

    test('to split teams into three groups with remainder if desired number of groups equals three', async () => {
      const numberOfGroups = 3;
      when(teamRepository.findAll()).thenResolve(teamEntities);
      const result = await teamService.shuffleGroups({ numberOfGroups });
      expect(result.length).toBe(3);
      expect(result.every((group) => group.teams.length <= 3)).toBe(true);
    });
  });
});
