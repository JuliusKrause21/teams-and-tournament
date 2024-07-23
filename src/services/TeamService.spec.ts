import { TeamRepository } from '../repositories/TeamRepository';
import { instance, mock, when } from 'ts-mockito';
import { TeamService } from './TeamService';
import { TeamEntity } from '../repositories/entities/TeamEntity';
import { ObjectId } from 'mongodb';

describe('TeamService', () => {
  let teamRepository: TeamRepository;
  let teamService: TeamService;

  beforeEach(() => {
    teamRepository = mock(TeamRepository);
    teamService = new TeamService(instance(teamRepository));
  });

  // TODO: Find a way to remove the back and forth mapping here caused by WithId.
  test('to list teams', async () => {
    const teamNames = ['First', 'Second'];
    const teams = teamNames.map((teamName) => new TeamEntity(teamName));
    when(teamRepository.findAll()).thenResolve(teams.map((team) => ({ ...team, _id: new ObjectId() })));

    const result = await teamService.listTeams();
    expect(result.map((r) => r.name)).toEqual(teams.map((team) => team.name));
  });
});
