import { WithId } from 'mongodb';
import { MatchEntity } from '../repositories/entities/MatchEntity';
import { MatchRepository } from '../repositories/MatchRepository';
import { inject, injectable } from 'inversify';

@injectable()
export class MatchesService {
  constructor(@inject(MatchRepository) private readonly matchRepository: MatchRepository) {}

  public listMatches(): Promise<WithId<MatchEntity>[]> {
    return this.matchRepository.findAll();
  }
}
