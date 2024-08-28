import { injectable } from 'inversify';
import { Group } from '../models/Team';
import { scheduleConfig } from '../dummyData';
import { DateTime } from 'luxon';
import { Game, MatchPlan } from '../models/Game';
import { v4 as uuid } from 'uuid';

@injectable()
export class MatchScheduleService {
  constructor() {}

  public setupMatchPlan(groups: Group[]): MatchPlan {
    console.log('Setup Matchplan');

    if (!groups.every((group) => group.teams.length > 1)) {
      return [];
    }

    const games: Game[] = groups.flatMap((group) =>
      group.teams.flatMap((team, index) =>
        group.teams.slice(index + 1).map((opponent) => ({
          gameId: uuid(),
          number: 0,
          team: { name: team.name, teamId: team.teamId },
          group: group.number,
          opponent: { name: opponent.name, teamId: opponent.teamId },
        }))
      )
    );

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

  public scheduleMatches(matchPlan: MatchPlan): MatchPlan {
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
}
