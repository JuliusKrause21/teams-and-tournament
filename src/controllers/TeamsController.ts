import { inject, injectable } from 'inversify';
import { TeamService } from '../services/TeamService';
import { Request, Response } from 'express';
import { isTeamQueryOption } from '../models/Team';

@injectable()
export class TeamsController {
  constructor(@inject(TeamService) private readonly teamsService: TeamService) {}
  public async listTeams(req: Request, res: Response): Promise<void> {
    console.log('List teams');
    const query = isTeamQueryOption(req.query) ? req.query : undefined;
    const listTeamsResult = await this.teamsService.listTeams(query);
    listTeamsResult.match(
      (teams) => res.json(teams),
      (error) => res.status(500).send(error)
    );
  }

  public async createTeam(req: Request, res: Response): Promise<void> {
    console.log('Create team');
    const createTeamResult = await this.teamsService.createTeam(req.body);
    createTeamResult.match(
      () => res.sendStatus(201),
      (error) => res.status(500).send(error)
    );
  }

  public async shuffleGroups(req: Request, res: Response): Promise<void> {
    console.log('Shuffle groups');
    const shuffleGroupsResult = await this.teamsService.shuffleGroups(req.body);
    shuffleGroupsResult.match(
      (groups) => res.json(groups),
      (error) => res.status(500).send(error)
    );
  }
}
