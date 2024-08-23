import { TeamEntity } from '../repositories/entities/TeamEntity';
import { bulkUpdate, TeamRepository } from '../repositories/TeamRepository';
import { inject, injectable } from 'inversify';
import { Group, Team, TeamQueryOptions } from '../models/Team';
import { scheduleConfig } from '../dummyData';
import { DateTime } from 'luxon';
import { groupBy } from 'lodash';

export interface ShuffleParameters {
  numberOfGroups: number;
}

interface Game {
  number: number;
  group: number;
  team: string;
  opponent: string;
  slot?: number;
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
    const slottedMatchPlan = this.adjustMatchSlots(matchPlan);
    console.log(slottedMatchPlan);
    const scheduledMatchPlan = this.scheduleMatches(matchPlan);
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

    return groups
      .flatMap((group) =>
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
      )
      .sort((a, b) => a.number - b.number);
  }

  public adjustMatchSlots(matchPlan: MatchPlan): MatchPlan {
    console.log('Adjust matchplan');
    console.log(matchPlan);
    let slot = 0;
    const slottedMatchPlan: MatchPlan = matchPlan.map((match, index) => {
      if (index > 0 && index % scheduleConfig.numberOfPitches === 0) {
        slot++;
      }
      return {
        ...match,
        slot,
      };
    });

    const swaps = groupBy(this.validateMatchPlan(slottedMatchPlan), 'slot');
    const slots = Object.keys(swaps);
    console.log(`Grouped swaps : ${JSON.stringify(swaps)}`);

    const possibleSwaps: { match: Game; swap: Game }[] = [];
    for (let iSlot = 0; iSlot < slots.length - 1; iSlot++) {
      for (let iMatch = 0; iMatch < swaps[slots[iSlot]].length; iMatch++) {
        for (let iSwap = 0; iSwap < swaps[slots[iSlot + 1]].length; iSwap++) {
          possibleSwaps.push({ match: swaps[slots[iSlot]][iMatch], swap: swaps[slots[iSlot + 1]][iSwap] });
        }
      }
    }

    const updateMatchPlan = this.adjust([slottedMatchPlan, slottedMatchPlan], possibleSwaps);
    console.log(updateMatchPlan);
    return updateMatchPlan;
  }

  public adjust(matchPlans: MatchPlan[], possibleSwaps: { match: Game; swap: Game }[]): MatchPlan {
    const matchPlan = matchPlans[0];
    const originalMatchPlan = matchPlans[1];
    if (this.validateMatchPlan(matchPlan).length === 0 || possibleSwaps.length === 0) {
      return matchPlan;
    }
    const possibleSwap = possibleSwaps.pop();
    if (!possibleSwap) {
      return matchPlan;
    }
    const updatedMatchPlan = this.swapEntries(possibleSwap.match, possibleSwap.swap, [...originalMatchPlan]);
    return this.adjust([updatedMatchPlan, originalMatchPlan], possibleSwaps);
  }

  private swapEntries(swapThis: Game, withThat: Game, matchPlan: MatchPlan): MatchPlan {
    matchPlan[matchPlan.indexOf(swapThis)] = {
      ...withThat,
      number: swapThis.number,
      slot: swapThis.slot,
    };
    matchPlan[matchPlan.indexOf(withThat)] = {
      ...swapThis,
      number: withThat.number,
      slot: withThat.slot,
    };
    return matchPlan;
  }

  private validateMatchPlan(matchPlan: MatchPlan): MatchPlan {
    return matchPlan.filter((match, index) =>
      matchPlan.some(
        (otherMatch, idx) =>
          otherMatch.slot === match.slot &&
          (otherMatch.team === match.team ||
            otherMatch.opponent === match.opponent ||
            otherMatch.team === match.opponent ||
            otherMatch.opponent === match.team) &&
          index !== idx
      )
    );
  }

  private scheduleMatches(matchPlan: MatchPlan): ScheduledMatchPlan {
    let slot = 0;
    return matchPlan.map((match, index) => {
      if (index > 0 && index % scheduleConfig.numberOfPitches === 0) {
        slot++;
      }
      return {
        ...match,
        start:
          DateTime.fromISO(scheduleConfig.startTime)
            .plus({
              minutes: slot * scheduleConfig.playTime + slot * scheduleConfig.breakBetweenMatches,
            })
            .toISOTime({ suppressMilliseconds: true, includeOffset: false }) ?? '',
      };
    });
  }

  private mapTeamEntityToTeam(teamEntity: TeamEntity): Team {
    return {
      teamId: teamEntity.team_id,
      group: teamEntity.group,
      name: teamEntity.name,
    };
  }
}
