import { MatchEntity } from '../repositories/entities/MatchEntity';
import { MatchRepository } from '../repositories/MatchRepository';
import { inject, injectable } from 'inversify';
import { NuLigaFacade } from '../facades/NuLigaFacade';
import { parse } from 'node-html-parser';
import { Match } from '../models/Match';
import { ApiResponse } from '../models/ApiResponse';

@injectable()
export class MatchesService {
  constructor(
    @inject(MatchRepository) private readonly matchRepository: MatchRepository,
    @inject(NuLigaFacade) private readonly nuligaFacade: NuLigaFacade
  ) {}

  public async listMatches(): Promise<ApiResponse<Match[]>> {
    const matchEntities = await this.matchRepository.findAll();
    return { statusCode: 200, body: matchEntities.map(this.mapMatchEntityToMatch) };
  }

  public async findMatch(matchId: string): Promise<Match> {
    const matchEntity = await this.matchRepository.findById(matchId);
    return this.mapMatchEntityToMatch(matchEntity);
  }

  public async updateMatch(matchId: string, newMatchData: Match): Promise<Match> {
    const matchEntity = await this.matchRepository.findById(matchId);

    const newMatchEntity: MatchEntity = {
      ...matchEntity,
      ...this.mapMatchToMatchEntity(newMatchData),
      last_modified: new Date().toISOString(),
    };

    await this.matchRepository.updateOne(matchId, newMatchEntity);
    return this.mapMatchEntityToMatch(newMatchEntity);
  }

  public async importMatches(): Promise<ApiResponse<Match[]>> {
    const matchEntities: MatchEntity[] = [];
    const html = await this.nuligaFacade.fetchHtml();

    const childNodes = parse(html).querySelector('#content-row2')?.querySelector('table')?.querySelectorAll('tr');

    if (childNodes) {
      for (const childNode of childNodes) {
        const trimmed = childNode.text
          .trim()
          .replaceAll('\n', '*')
          .replaceAll('\t', '*')
          .replaceAll('\r', '')
          .replaceAll(/\s{2,}/g, '');
        const rowEntries = trimmed.split(/[*]+/g);
        if (rowEntries.length < 7) {
          console.table(rowEntries);
          continue;
        }
        const date = new Date(`${rowEntries[1].split('.').reverse().join('-')}T${rowEntries[2]}`).toISOString();
        matchEntities.push(
          new MatchEntity({
            day: rowEntries[0],
            date,
            match_number: rowEntries[4],
            home_team: rowEntries[5],
            away_team: rowEntries[6],
            location: rowEntries[3],
          })
        );
      }
      console.table(matchEntities);

      const result = await this.matchRepository.bulkInsert(matchEntities);
      if (!result.acknowledged) {
        return { statusCode: 500 };
      }
    }

    return {
      statusCode: 201,
      body: matchEntities.map(this.mapMatchEntityToMatch),
    };
  }

  private mapMatchEntityToMatch(matchEntity: MatchEntity): Match {
    return {
      day: matchEntity.day,
      date: matchEntity.date,
      homeTeam: matchEntity.home_team,
      awayTeam: matchEntity.away_team,
      location: matchEntity.location,
      availablePlayers: matchEntity.available_players ?? [],
    };
  }

  private mapMatchToMatchEntity(match: Match): Partial<MatchEntity> {
    return {
      day: match.day,
      date: match.date,
      home_team: match.homeTeam,
      away_team: match.awayTeam,
      location: match.location,
      available_players: match.availablePlayers,
    };
  }
}
