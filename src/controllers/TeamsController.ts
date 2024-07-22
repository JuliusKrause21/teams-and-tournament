import { inject, injectable } from 'inversify';
import { TeamService } from '../services/TeamService';
import { ApiResponse } from '../models/ApiResponse';
import { Teams } from '../models/Teams';
import { TeamEntity } from '../repositories/entities/TeamEntity';

@injectable()
export class TeamsController {
  constructor(@inject(TeamService) private readonly teamsService: TeamService) {}
  public async listTeams(): Promise<ApiResponse<Teams[]>> {
    try {
      const teams = await this.teamsService.listTeams();
      return { statusCode: 200, body: teams };
    } catch (error) {
      return { statusCode: 500 };
    }
  }

  public async createTeam(teamEntity: TeamEntity): Promise<ApiResponse<undefined>> {
    try {
      await this.teamsService.createTeam(teamEntity);
      return { statusCode: 201 };
    } catch (error) {
      return { statusCode: 500 };
    }
  }
}
