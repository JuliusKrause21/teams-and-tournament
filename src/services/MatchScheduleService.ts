import { injectable } from 'inversify';
import { DateTime } from 'luxon';
import { GameScheduleOptions, MatchPlan } from '../models/Game';

@injectable()
export class MatchScheduleService {
  constructor() {}

  public scheduleMatches(matchPlan: MatchPlan, scheduleOptions: Partial<GameScheduleOptions>): MatchPlan {
    console.log('Schedule matches');

    let slot = 0;
    const numberOfPitches = Math.max(...matchPlan.map((game) => game?.slot ?? 1));
    return matchPlan.map((match, index) => {
      if (index > 0 && index % numberOfPitches === 0) {
        slot++;
      }
      return {
        ...match,
        schedule: {
          date: DateTime.fromISO(scheduleOptions.date ?? '').toISODate({ format: 'extended' }) ?? '',
          start:
            scheduleOptions.date === undefined ||
            scheduleOptions.playTimeInMinutes === undefined ||
            scheduleOptions.breakBetweenInMinutes === undefined
              ? ''
              : (DateTime.fromISO(scheduleOptions.date)
                  .plus({
                    minutes: slot * scheduleOptions.playTimeInMinutes + slot * scheduleOptions.breakBetweenInMinutes,
                  })
                  .toISOTime({ suppressMilliseconds: true, includeOffset: false }) ?? ''),
          durationInMinutes: scheduleOptions.playTimeInMinutes,
          location: scheduleOptions.location ?? 'First pitch',
        },
      };
    });
  }
}
