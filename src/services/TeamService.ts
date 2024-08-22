import { TeamEntity } from '../repositories/entities/TeamEntity';
import { bulkUpdate, TeamRepository } from '../repositories/TeamRepository';
import { inject, injectable } from 'inversify';
import { Group, Team, TeamQueryOptions } from '../models/Team';
import { scheduleConfig } from '../dummyData';
import { DateTime } from 'luxon';

export interface ShuffleParameters {
  numberOfGroups: number;
}

interface Game {
  number: number;
  group: number;
  team: string;
  opponent: string;
}

type MatchPlan = Game[];
type ScheduledMatchPlan = (Game & { start: string })[];

@injectable()
export class TeamService {
  constructor(@inject(TeamRepository) private readonly teamRepository: TeamRepository) {}

  public async listTeams(query?: TeamQueryOptions): Promise<Team[]> {
    /*
    This just returns the result of the repository call, but this is the place where the business logic is implemented
    Calls to several repositories, data combination and mapping takes place here.
     */
    const teamEntities = await this.teamRepository.findAll(query);
    return teamEntities.map(this.mapTeamEntityToTeam);
  }

  public async createTeam(teamEntity: TeamEntity): Promise<void> {
    await this.teamRepository.insert(teamEntity);
  }

  public async shuffleGroups({ numberOfGroups }: ShuffleParameters): Promise<Group[]> {
    console.log('Shuffle teams into groups');
    const groups: Group[] = [];
    const teamEntities = await this.teamRepository.findAll();
    const sliceAt = Math.ceil(teamEntities.length / numberOfGroups);

    for (let i = 0; i < numberOfGroups; i++) {
      groups.push({
        number: i + 1,
        teams: teamEntities
          .slice(i * sliceAt, (i + 1) * sliceAt)
          .map((teamEntity) => ({ teamId: teamEntity.team_id, name: teamEntity.name })),
      });
    }
    const matchPlan = this.setupMatchPlan(groups);
    console.table(matchPlan);
    const scheduledMatchPlan = this.scheduleMatches(matchPlan, numberOfGroups);
    console.table(scheduledMatchPlan);

    const teamsUpdateData: bulkUpdate[] = groups.flatMap((group) =>
      group.teams.map((team) => ({
        team_id: team.teamId,
        updateFields: { group: group.number },
      }))
    );

    await this.teamRepository.bulkUpdate(teamsUpdateData);

    return groups;
  }

  private setupMatchPlan(groups: Group[]): MatchPlan {
    const games = groups.flatMap((group) =>
      group.teams.flatMap((team, index) =>
        group.teams
          .slice(index + 1)
          .map((opponent) => ({ team: team.name, group: group.number, opponent: opponent.name }))
      )
    );
    console.table(games);

    return groups.flatMap((group) =>
      games
        .filter((game) => game.group === group.number)
        .slice(0, group.teams.length - 1)
        .map((game, index) => ({ ...game, number: 2 * index + 1 }))
        .concat(
          games
            .filter((game) => game.group === group.number)
            .slice(group.teams.length - 1)
            .reverse()
            .map((game, index) => ({ ...game, number: 2 * index + 2 }))
        )
        .sort((a, b) => a.number - b.number)
    );
  }

  private scheduleMatches(matchPlan: MatchPlan, numberOfGroups: number): ScheduledMatchPlan {
    if (scheduleConfig.numberOfPitches === numberOfGroups) {
      return matchPlan.map((match) => ({
        ...match,
        start:
          DateTime.fromISO(scheduleConfig.startTime)
            .plus({
              minutes:
                (match.number - 1) * scheduleConfig.playTime + (match.number - 1) * scheduleConfig.breakBetweenMatches,
            })
            .toISOTime({ suppressMilliseconds: true, includeOffset: false }) ?? '',
      }));
    }
    return [] as ScheduledMatchPlan;
  }

  private mapTeamEntityToTeam(teamEntity: TeamEntity): Team {
    return {
      teamId: teamEntity.team_id,
      group: teamEntity.group,
      name: teamEntity.name,
    };
  }
}
