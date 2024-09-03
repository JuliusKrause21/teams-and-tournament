import { injectable } from 'inversify';
import { scheduleConfig } from '../dummyData';
import { DateTime } from 'luxon';
import { MatchPlan } from '../models/Game';

@injectable()
export class MatchScheduleService {
  constructor() {}

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
