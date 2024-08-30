import { inject, injectable } from 'inversify';
import { Game, MatchPlan } from '../models/Game';
import { uniq } from 'lodash';
import { MatchValidationService } from './MatchValidationService';

type UsedIdsOfSlot = { slot: number; ids: string[] };

@injectable()
export class MatchDistributionService {
  constructor(@inject(MatchValidationService) private readonly matchValidationService: MatchValidationService) {}
  public distributeMatchSlots(matchPlan: MatchPlan, numberOfPitches: number): MatchPlan {
    console.log('Distribute match slots');

    const validation = this.matchValidationService.validateMatchPlan(matchPlan);
    if (validation.length > 0) {
      throw new Error('Validation failed', { cause: validation });
    }

    // TODO: distribute slots for each Group
    return this.distribute(matchPlan, numberOfPitches);
  }

  private distribute(matchPlan: MatchPlan, numberOfPiches: number): MatchPlan {
    const numberOfTeams = uniq(matchPlan.flatMap((game) => this.getTeamIdsOfGame(game))).length;
    const numberOfParallelGames = numberOfTeams > 3 ? numberOfPiches : 1;
    const usedIdsOfSlots: UsedIdsOfSlot[] = [];
    let slot = 1;

    while (matchPlan.find((game) => !game.slot)) {
      const gamesWithoutSlot = matchPlan.filter((game) => !game.slot);
      let gameIndex = 0;
      let lastGameDidNotMatch = false;
      for (const game of gamesWithoutSlot) {
        if (gameIndex > 0 && gameIndex % numberOfParallelGames === 0) {
          if (!lastGameDidNotMatch) {
            slot++;
            usedIdsOfSlots.push({ slot, ids: this.getTeamIdsOfGame(game) });
            matchPlan = this.updateMatchPlan(matchPlan, [{ ...game, slot }]);
          }
        } else {
          if (this.isIdUsedInSlot(game, slot, usedIdsOfSlots)) {
            if (gamesWithoutSlot.length === 1) {
              matchPlan = this.swapSlots(matchPlan, game, slot);
              break;
            }
            lastGameDidNotMatch = true;
          } else {
            usedIdsOfSlots.push({ slot, ids: this.getTeamIdsOfGame(game) });
            matchPlan = this.updateMatchPlan(matchPlan, [{ ...game, slot }]);
            if (lastGameDidNotMatch) {
              slot++;
              break;
            }
          }
        }
        gameIndex++;
      }
    }
    return matchPlan;
  }

  private isIdUsedInSlot(game: Game, slot: number, usedIdsOfSlots: UsedIdsOfSlot[]): boolean {
    const usedIdsOfSlot = usedIdsOfSlots
      .filter((usedIdsOfSlot) => usedIdsOfSlot.slot === slot)
      .map((usedIdsOfSlot) => usedIdsOfSlot.ids);
    return usedIdsOfSlot.some(
      (ids) => ids.includes(game.team.teamId ?? '') || ids.includes(game.opponent.teamId ?? '')
    );
  }

  private updateMatchPlan(matchPlan: MatchPlan, update: Game[]): MatchPlan {
    const updateGameIds = update.map((game) => game.gameId);
    return [...matchPlan.filter((game) => !updateGameIds.includes(game.gameId)), ...update];
  }

  private swapSlots(matchPlan: Game[], currentGame: Game, currentSlotNumber: number): MatchPlan {
    let swapPossible = false;
    for (let iSlot = 0; iSlot < currentSlotNumber; iSlot++) {
      const currentSlot = matchPlan.filter((game) => game.slot === currentSlotNumber);
      const swapSlot = matchPlan.filter((game) => game.slot === iSlot + 1);
      const swapGame = this.findSwap(currentGame, currentSlot, swapSlot);

      if (swapGame !== undefined) {
        swapPossible = true;
        matchPlan = this.updateMatchPlan(matchPlan, [
          { ...swapGame, slot: currentSlotNumber },
          { ...currentGame, slot: iSlot + 1 },
        ]);
      }
      if (swapPossible) {
        break;
      }
    }
    if (!swapPossible) {
      matchPlan = this.updateMatchPlan(matchPlan, [
        {
          ...currentGame,
          slot: currentSlotNumber + 1,
        },
      ]);
    }
    return matchPlan;
  }

  private findSwap(currentGame: Game, currentSlot: Game[], swapSlot: Game[]): Game | undefined {
    for (let iSwap = 0; iSwap < swapSlot.length; iSwap++) {
      const swapCandidate = swapSlot[iSwap];

      const updatedSwapSlot = uniq([
        ...this.getTeamIdsOfSlot(swapSlot.filter((game) => game.gameId !== swapCandidate.gameId)),
        ...this.getTeamIdsOfGame(currentGame),
      ]);
      const updatedCurrentSlot = uniq([...this.getTeamIdsOfSlot(currentSlot), ...this.getTeamIdsOfGame(swapCandidate)]);

      if (
        updatedCurrentSlot.length === this.getTeamIdsOfSlot(currentSlot).length + 2 &&
        updatedSwapSlot.length === this.getTeamIdsOfSlot(swapSlot).length
      ) {
        return swapCandidate;
      }
    }
    return undefined;
  }

  private getTeamIdsOfSlot(slot: Game[]): string[] {
    return slot.flatMap(this.getTeamIdsOfGame);
  }

  private getTeamIdsOfGame(game: Game): string[] {
    return [game.team.teamId!, game.opponent.teamId!];
  }
}
