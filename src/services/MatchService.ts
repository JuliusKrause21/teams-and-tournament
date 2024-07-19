import { Db, WithId } from 'mongodb';
import { MatchEntity } from '../repositories/entities/MatchEntity';
import { MatchRepository } from '../repositories/entities/MatchRepository';

export class MatchService {
  constructor(private readonly db: Db) {
    this.matchRepository = new MatchRepository(this.db);
  }

  private matchRepository: MatchRepository;

  public listMatches(): Promise<WithId<MatchEntity>[]> {
    return this.matchRepository.findAll();
  }
}
