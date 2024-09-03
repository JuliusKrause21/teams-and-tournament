import { inject, injectable } from 'inversify';
import { Game, MatchPlan } from '../models/Game';
import { uniq } from 'lodash';
import { MatchValidationService } from './MatchValidationService';
import { Group, Team } from '../models/Team';
import { v4 as uuid } from 'uuid';

type UsedIdsOfSlot = { slot: number; ids: string[] };
type BaseGame = Omit<Game, 'number' | 'group'>;

@injectable()
export class MatchDistributionService {
  constructor(@inject(MatchValidationService) private readonly matchValidationService: MatchValidationService) {}

  public generateOptimizedMatchPlan(groups: Group[]): MatchPlan {
    if (!groups.every((group) => group.teams.length > 1)) {
      return [];
    }
    return groups
      .flatMap((group) => this.generateMatchPlanPerGroup(group))
      .sort((gameOne, gameTwo) => gameOne.number - gameTwo.number);
  }

  public distributeMatchSlots(matchPlan: MatchPlan, numberOfPitches: number): MatchPlan {
    console.log('Distribute match slots');

    const validation = this.matchValidationService.validateMatchPlan(matchPlan);
    if (validation.length > 0) {
      throw new Error('Validation failed', { cause: validation });
    }

    return this.distribute(matchPlan, numberOfPitches);
  }

  private generateMatchPlanPerGroup(group: Group): MatchPlan {
    const matchPlan: MatchPlan = [];
    const games = this.generateGames(group.teams);
    let gameIndex = 1;
    while (matchPlan.length < games.length) {
      const nextGame = this.findNextCombination(matchPlan, games);
      matchPlan.push({ ...nextGame, number: gameIndex, group: group.number });
      gameIndex++;
    }
    return matchPlan;
  }

  private isGameAlreadyPlanned(matchPlan: MatchPlan, gameId: string): boolean {
    return matchPlan.filter((game) => game.gameId === gameId).length !== 0;
  }

  private generateGames(teams: Team[]): BaseGame[] {
    return teams.flatMap((team) =>
      teams
        .slice(teams.findIndex((opponent) => opponent.teamId === team.teamId) + 1)
        .map((opponent) => ({ gameId: uuid(), team, opponent }))
    );
  }

  private findNextCombination(matchPlan: MatchPlan, games: BaseGame[]): BaseGame {
    let score = 0;
    let nextGame: BaseGame = {} as BaseGame;
    for (const game of games.reverse()) {
      if (this.isGameAlreadyPlanned(matchPlan, game.gameId)) {
        continue;
      }
      nextGame = game;
      const numberOfOccuringTeams =
        this.getTeamIdsOfSlot(matchPlan).filter((id) => id === game.team.teamId).length +
        this.getTeamIdsOfSlot(matchPlan).filter((id) => id === game.opponent.teamId).length;

      if (numberOfOccuringTeams < score) {
        nextGame = game;
      }
      score = numberOfOccuringTeams;
    }
    return nextGame;
  }

  private distribute(matchPlan: MatchPlan, numberOfPitches: number): MatchPlan {
    const numberOfTeams = uniq(matchPlan.flatMap((game) => this.getTeamIdsOfGame(game))).length;
    const numberOfParallelGames = numberOfTeams > 3 ? numberOfPitches : 1;
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
