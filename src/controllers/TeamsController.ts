import { inject, injectable } from 'inversify';
import { TeamService } from '../services/TeamService';
import { Request, Response } from 'express';
import { isTeamQueryOption } from '../models/Team';

@injectable()
export class TeamsController {
  constructor(@inject(TeamService) private readonly teamsService: TeamService) {}
  public async listTeams(req: Request, res: Response): Promise<void> {
    const query = isTeamQueryOption(req.query) ? req.query : undefined;
    try {
      const teams = await this.teamsService.listTeams(query);
      res.status(200).json(teams);
    } catch (error) {
      res.sendStatus(500);
    }
  }

  public async createTeam(req: Request, res: Response): Promise<void> {
    try {
      await this.teamsService.createTeam(req.body);
      res.sendStatus(201);
    } catch (error) {
      res.sendStatus(500);
    }
  }

  public async shuffleGroups(req: Request, res: Response): Promise<void> {
    console.log('Shuffle groups');
    try {
      const groups = await this.teamsService.shuffleGroups(req.body);
      res.status(200).json(groups);
    } catch (error) {
      res.status(500).json(error);
    }
  }
}
