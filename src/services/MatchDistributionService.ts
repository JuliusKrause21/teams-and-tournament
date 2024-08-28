import { inject, injectable } from 'inversify';
import { Game, MatchPlan } from '../models/Game';
import { scheduleConfig } from '../dummyData';
import { groupBy } from 'lodash';
import { MatchValidationService } from './MatchValidationService';

@injectable()
export class MatchDistributionService {
  constructor(@inject(MatchValidationService) private readonly matchValidationService: MatchValidationService) {}
  public distributeMatchSlots(matchPlan: MatchPlan): MatchPlan {
    console.log('Distribute match slots');

    const validation = this.matchValidationService.validateMatchPlan(matchPlan);
    if (validation.length > 0) {
      throw new Error('Validation failed', { cause: validation });
    }

    const matchPlanWithSlots = this.addSlotsToGames(matchPlan);
    if (this.matchValidationService.validateMatchPlan(matchPlanWithSlots).length === 0) {
      return matchPlanWithSlots;
    }

    const possibleSwaps = this.listPossibleSwaps(matchPlanWithSlots);

    return this.adjustSLots(new Array(2).fill(matchPlanWithSlots), possibleSwaps);
  }

  private addSlotsToGames(matchPlan: MatchPlan): MatchPlan {
    let slot = 0;
    return matchPlan.map((match, index) => {
      if (index > 0 && index % scheduleConfig.numberOfPitches === 0) {
        slot++;
      }
      return {
        ...match,
        slot,
      };
    });
  }

  private listPossibleSwaps(matchPlan: MatchPlan): { match: Game; swap: Game }[] {
    const swaps = groupBy(this.matchValidationService.listInvalidSlotCombinations(matchPlan), 'slot');
    const slots = Object.keys(swaps);

    const possibleSwaps: { match: Game; swap: Game }[] = [];
    for (let iSlot = 0; iSlot < slots.length - 1; iSlot++) {
      for (let iMatch = 0; iMatch < swaps[slots[iSlot]].length; iMatch++) {
        for (let iSwap = 0; iSwap < swaps[slots[iSlot + 1]].length; iSwap++) {
          possibleSwaps.push({ match: swaps[slots[iSlot]][iMatch], swap: swaps[slots[iSlot + 1]][iSwap] });
        }
      }
    }
    return possibleSwaps;
  }

  private adjustSLots(matchPlans: MatchPlan[], possibleSwaps: { match: Game; swap: Game }[]): MatchPlan {
    const matchPlan = matchPlans[0];
    const originalMatchPlan = matchPlans[1];
    if (this.listPossibleSwaps(matchPlan).length === 0 || possibleSwaps.length === 0) {
      return matchPlan;
    }
    const possibleSwap = possibleSwaps.pop();
    if (!possibleSwap) {
      return matchPlan;
    }
    const updatedMatchPlan = this.swapEntries(possibleSwap.match, possibleSwap.swap, [...originalMatchPlan]);
    return this.adjustSLots([updatedMatchPlan, originalMatchPlan], possibleSwaps);
  }

  private swapEntries(swapThis: Game, swapThat: Game, matchPlan: MatchPlan): MatchPlan {
    matchPlan[matchPlan.indexOf(swapThis)] = {
      ...swapThat,
      number: swapThis.number,
      slot: swapThis.slot,
    };
    matchPlan[matchPlan.indexOf(swapThat)] = {
      ...swapThis,
      number: swapThat.number,
      slot: swapThat.slot,
    };
    return matchPlan;
  }
}
