import { inject, injectable } from 'inversify';
import { MatchesService } from '../services/MatchesService';
import { ApiResponse } from '../models/ApiResponse';
import { Match } from '../models/Match';
import { MatchRepositoryError } from '../repositories/MatchRepository';

@injectable()
export class MatchesController {
  constructor(@inject(MatchesService) private readonly matchesService: MatchesService) {}

  public async listMatches(): Promise<ApiResponse<Match[]>> {
    try {
      const { statusCode, body } = await this.matchesService.listMatches();
      return { statusCode, body };
    } catch (error) {
      return { statusCode: 500 };
    }
  }

  public async findMatch(matchId: string): Promise<ApiResponse<Match | undefined>> {
    try {
      const match = await this.matchesService.findMatch(matchId);
      return { statusCode: 200, body: match };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === MatchRepositoryError.FindMatchFailed) {
          return { statusCode: 404 };
        }
      }
      return { statusCode: 500 };
    }
  }
    } catch (error) {
      return { statusCode: 500 };
    }
  }

  public async importMatches(): Promise<ApiResponse<Match[]>> {
    try {
      const { statusCode, body } = await this.matchesService.importMatches();
      return { statusCode, body };
    } catch (error) {
      return { statusCode: 500 };
    }
  }
}
