import { inject, injectable } from 'inversify';
import { MatchesService } from '../services/MatchesService';
import { ApiResponse } from '../models/ApiResponse';
import { Matches } from '../models/Matches';

@injectable()
export class MatchesController {
  constructor(@inject(MatchesService) private readonly matchesService: MatchesService) {}

  public async listMatches(): Promise<ApiResponse<Matches[]>> {
    const matches = await this.matchesService.listMatches();
    return { statusCode: 200, body: matches };
  }
}
