import { inject, injectable } from 'inversify';
import { TeamService } from '../services/TeamService';
import { ApiResponse } from '../models/ApiResponse';
import { Teams } from '../models/Teams';

@injectable()
export class TeamsController {
  constructor(@inject(TeamService) private readonly teamsService: TeamService) {}
  public async listTeams(): Promise<ApiResponse<Teams[]>> {
    const teams = await this.teamsService.listTeams();
    return { statusCode: 200, body: teams };
  }
}
