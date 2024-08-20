import { MatchEntity } from '../repositories/entities/MatchEntity';
import { MatchRepository } from '../repositories/MatchRepository';
import { inject, injectable } from 'inversify';
import { NuLigaFacade } from '../facades/NuLigaFacade';
import { parse } from 'node-html-parser';
import { isMatchQueryOption, Match, MatchQueryOptions } from '../models/Match';
import { TaskEntity } from '../repositories/entities/TaskEntity';
import * as dummyData from '../dummyData';
import { Condition } from '../dummyData';
import { compact } from 'lodash';
import { TaskRepository } from '../repositories/TaskRepository';

export enum MatchesServiceError {
  FailedToParseHtml = 'Failed to parse html',
}

@injectable()
export class MatchesService {
  constructor(
    @inject(MatchRepository) private readonly matchRepository: MatchRepository,
    @inject(TaskRepository) private readonly taskRepository: TaskRepository,
    @inject(NuLigaFacade) private readonly nuligaFacade: NuLigaFacade
  ) {}

  public async listMatches(query?: MatchQueryOptions): Promise<Match[]> {
    const matchEntities = await this.matchRepository.findAll(this.mapQueryToEntityQuery(query));
    return matchEntities.map(this.mapMatchEntityToMatch);
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

  public async importMatches(): Promise<void> {
    const matchEntities: MatchEntity[] = [];
    const taskEntities: TaskEntity[] = [];

    const html = await this.nuligaFacade.fetchHtml();

    const rows = this.parseHtmlPage(html);
    for (const row of rows) {
      const date = new Date(`${row[1].split('.').reverse().join('-')}T${row[2]}`).toISOString();
      const newMatchEntity = new MatchEntity({
        day: row[0],
        date,
        match_number: row[4],
        home_team: row[5],
        away_team: row[6],
        location: row[3],
      });
      this.createDefaultTasks(newMatchEntity).forEach((newMatchEntity) => taskEntities.push(newMatchEntity));
      matchEntities.push(newMatchEntity);
    }
    console.table(matchEntities);
    await this.matchRepository.bulkInsert(matchEntities);
    console.table(taskEntities);
    await this.taskRepository.bulkInsert(taskEntities);
  }

  private mapQueryToEntityQuery(matchQuery?: MatchQueryOptions): Partial<MatchEntity> | undefined {
    if (!isMatchQueryOption(matchQuery)) {
      return;
    }
    return {
      date: matchQuery.date,
    };
  }

  private createDefaultTasks(matchEntity: MatchEntity): TaskEntity[] {
    return compact(
      Object.entries(dummyData.defaultTasks).flatMap(([condition, tasks]) => {
        switch (condition as Condition) {
          case Condition.HomeGame:
            if (matchEntity.home_team === 'TSV Weilheim') {
              return tasks.map((task) => new TaskEntity({ ...task, due_date: matchEntity.date }));
            }
            return;
          case Condition.AwayGame:
            if (matchEntity.away_team === 'TSV Weilheim') {
              return tasks.map((task) => new TaskEntity({ ...task, due_date: matchEntity.date }));
            }
            return;
          default:
            return;
        }
      })
    );
  }

  private parseHtmlPage(html: string): string[][] {
    const childNodes = parse(html).querySelector('#content-row2')?.querySelector('table')?.querySelectorAll('tr');
    if (!childNodes) {
      console.error(MatchesServiceError.FailedToParseHtml);
      throw new Error(MatchesServiceError.FailedToParseHtml);
    }
    const rows = [];
    for (const childNode of childNodes!) {
      const trimmed = childNode.text
        .trim()
        .replaceAll('\n', '*')
        .replaceAll('\t', '*')
        .replaceAll('\r', '')
        .replaceAll(/\s{2,}/g, '');
      const columns = trimmed.split(/[*]+/g);
      if (columns.length !== 7) {
        console.table(columns);
        continue;
      }
      rows.push(columns);
    }
    return rows;
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
