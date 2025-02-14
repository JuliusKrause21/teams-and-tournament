import { TeamRepository } from '../repositories/TeamRepository';
import { anything, deepEqual, instance, mock, when } from 'ts-mockito';
import { TeamService, TeamServiceError } from './TeamService';
import { buildTeamEntityFromTeam, teams } from '../testData';
import { err, ok } from 'neverthrow';

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
      when(teamRepository.findAll(undefined)).thenResolve(ok(teamEntities));

      const result = await teamService.listTeams();
      expect(result).toEqual(ok(expectedTeams));
    });

    test('to list all teams valid query', async () => {
      const expectedTeam = { ...teams[0], group: 1 };
      const query = { group: expectedTeam.group };
      const teamEntity = buildTeamEntityFromTeam(expectedTeam);
      when(teamRepository.findAll(deepEqual(query))).thenResolve(ok([teamEntity]));

      const result = await teamService.listTeams(query);
      expect(result).toEqual(ok([expectedTeam]));
    });
  });

  describe('shuffleGroups', () => {
    test('to return an error if there are no teams in db', async () => {
      const numberOfGroups = 1;
      when(teamRepository.findAll()).thenResolve(ok([]));
      const result = await teamService.shuffleGroups({ numberOfGroups });
      expect(result).toEqual(err(new Error(TeamServiceError.NoTeamsFound)));
    });

    test('to return only one group if desired number of groups equals one', async () => {
      const numberOfGroups = 1;
      when(teamRepository.findAll()).thenResolve(ok(teamEntities));
      when(teamRepository.bulkUpdate(anything())).thenResolve(ok(undefined));
      const result = await teamService.shuffleGroups({ numberOfGroups });
      const groups = result._unsafeUnwrap();
      expect(groups.length).toEqual(1);
      expect(groups.every((group) => group.teams.length === teams.length)).toBe(true);
    });

    test('to split teams into two groups if desired number of groups equals two', async () => {
      const numberOfGroups = 2;
      when(teamRepository.findAll()).thenResolve(ok(teamEntities));
      when(teamRepository.bulkUpdate(anything())).thenResolve(ok(undefined));
      const result = await teamService.shuffleGroups({ numberOfGroups });
      const groups = result._unsafeUnwrap();
      expect(groups.length).toBe(2);
      expect(groups.every((group) => group.teams.length === 4)).toBe(true);
    });

    test('to split teams into three groups with remainder if desired number of groups equals three', async () => {
      const numberOfGroups = 3;
      when(teamRepository.findAll()).thenResolve(ok(teamEntities));
      when(teamRepository.bulkUpdate(anything())).thenResolve(ok(undefined));
      const result = await teamService.shuffleGroups({ numberOfGroups });
      const groups = result._unsafeUnwrap();
      expect(groups.length).toBe(3);
      expect(groups.every((group) => group.teams.length <= 3)).toBe(true);
    });
  });
});
