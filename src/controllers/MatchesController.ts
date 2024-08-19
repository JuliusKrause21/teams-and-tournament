import { inject, injectable } from 'inversify';
import { MatchesService, MatchesServiceError } from '../services/MatchesService';
import { MatchRepositoryError } from '../repositories/MatchRepository';
import { Request, Response } from 'express';
import { NuLigaFacadeError } from '../facades/NuLigaFacade';

@injectable()
export class MatchesController {
  constructor(@inject(MatchesService) private readonly matchesService: MatchesService) {}

  public async listMatches(_req: Request, res: Response): Promise<void> {
    try {
      const matches = await this.matchesService.listMatches();
      res.status(200).json(matches);
    } catch (error) {
      this.handleMatchesErrors(error, res);
    }
  }

  public async findMatch(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const match = await this.matchesService.findMatch(id);
      res.status(200).json(match);
    } catch (error) {
      this.handleMatchesErrors(error, res);
    }
  }

  public async updateMatch(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const match = await this.matchesService.updateMatch(id, req.body);
      res.status(200).json(match);
    } catch (error) {
      this.handleMatchesErrors(error, res);
    }
  }

  public async importMatches(_req: Request, res: Response): Promise<void> {
    try {
      await this.matchesService.importMatches();
      res.sendStatus(200);
    } catch (error) {
      this.handleMatchesErrors(error, res);
    }
  }

  private handleMatchesErrors(error: unknown, res: Response): void {
    if (error instanceof Error) {
      switch (error.message) {
        case MatchRepositoryError.FindMatchFailed:
          res.sendStatus(404);
          break;
        case MatchRepositoryError.UpdateMatchFailed:
        case MatchRepositoryError.UpdateAcknowledgeFailed:
        case MatchRepositoryError.InsertAcknowledgeFailed:
        case MatchesServiceError.FailedToParseHtml:
        case NuLigaFacadeError.FailedDToFetch:
          res.sendStatus(500);
          break;
      }
    }
    res.sendStatus(500);
  }
}
