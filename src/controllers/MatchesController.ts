import { inject, injectable } from 'inversify';
import { MatchesService } from '../services/MatchesService';
import { ApiResponse } from '../models/ApiResponse';
import { Match } from '../models/Match';

@injectable()
export class MatchesController {
  constructor(@inject(MatchesService) private readonly matchesService: MatchesService) {}

  public async listMatches(): Promise<ApiResponse<Match[]>> {
    try {
      await this.matchesService.listMatches();
      return { statusCode: 200 };
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
