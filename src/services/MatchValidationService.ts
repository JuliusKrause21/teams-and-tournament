import { injectable } from 'inversify';
import { Game, MatchPlan } from '../models/Game';
import { compact, groupBy, uniq, uniqWith } from 'lodash';

export enum ValidationMessage {
  InvalidNumberOfGamesInGroup = 'Number of games does not match number of teams in group.',
  InvalidCombinationOfTeams = 'Combination of teams is not possible.',
  InvalidDistributionOfTeams = 'Team can not be part of several groups.',
  EmptyMatchPlan = 'Match plan is empty.',
  InvalidCombinationsOfGames = 'Combination of games is invalid.',
  EqualIds = 'Both teams in game have equal id',
}

export interface Validation {
  message: ValidationMessage;
  games: Game[];
  group?: number;
  teamIds?: string[];
}

@injectable()
export class MatchValidationService {
  constructor() {}
  public validateMatchPlan(matchPlan: MatchPlan): Validation[] {
    console.log('Validate match plan');
    const validation: (Validation | undefined)[] = [];
    if (matchPlan.length === 0) {
      validation.push({ message: ValidationMessage.EmptyMatchPlan, games: [] });
    }
    validation.push(...this.validateTeamsAcrossGroups(matchPlan));

    const groups = groupBy(matchPlan, 'group');
    Object.values(groups).map((games, index) => {
      validation.push(this.validateUniqueGameCombinations(games, index + 1));
      validation.push(...this.validateTeamIdsInGames(games, index + 1));
      validation.push(this.validateGamesPerGroup(games, index + 1));
      validation.push(this.validateSlotCombinationsPerGroup(games, index + 1));
    });

    return compact(validation);
  }

  public validateSlotCombinations(matchPlan: MatchPlan): boolean {
    const groups = groupBy(matchPlan, 'group');
    return (
      compact(Object.values(groups).map((games, index) => this.validateSlotCombinationsPerGroup(games, index)))
        .length === 0
    );
  }

  private validateSlotCombinationsPerGroup(games: Game[], group: number): Validation | undefined {
    const invalidCombinations = this.listInvalidSlotCombinations(games);
    if (invalidCombinations.length > 0) {
      return {
        message: ValidationMessage.InvalidCombinationsOfGames,
        group,
        games: invalidCombinations,
      };
    }
    return undefined;
  }

  public listInvalidSlotCombinations(games: Game[]): Game[] {
    return games.filter((game, index) =>
      games.some(
        (otherGame, idx) =>
          otherGame.slot &&
          game.slot &&
          otherGame.slot === game.slot &&
          (otherGame.team.teamId === game.team.teamId ||
            otherGame.opponent.teamId === game.opponent.teamId ||
            otherGame.team.teamId === game.opponent.teamId ||
            otherGame.opponent.teamId === game.team.teamId) &&
          index !== idx
      )
    );
  }

  private validateTeamsAcrossGroups(matchPlan: MatchPlan): Validation[] {
    const validation: Validation[] = [];
    const groups = groupBy(matchPlan, 'group');
    const teamIds = Object.values(groups).flatMap((games) => uniq(this.getTeamIds(games)));
    teamIds.forEach((teamId, index) => {
      const duplicateFound = teamIds.some((otherTeamId, idx) => otherTeamId === teamId && idx !== index);
      if (duplicateFound && validation.find((entry) => entry.teamIds?.includes(teamId)) === undefined) {
        validation.push({ message: ValidationMessage.InvalidDistributionOfTeams, teamIds: [teamId], games: [] });
      }
    });
    return uniqWith(validation);
  }

  private validateGamesPerGroup(games: Game[], group: number): Validation | undefined {
    const uniqueTeamIds = uniq(this.getTeamIds(games));
    if (games.length !== this.calculateGamePermutations(uniqueTeamIds.length)) {
      return { message: ValidationMessage.InvalidNumberOfGamesInGroup, group, games };
    }
    return undefined;
  }

  private validateTeamIdsInGames(games: Game[], group: number): Validation[] {
    return compact(
      games.map((game) => {
        if (game.team.teamId === game.opponent.teamId) {
          return { message: ValidationMessage.EqualIds, group, games: [game] };
        }
        return undefined;
      })
    );
  }

  private validateUniqueGameCombinations(games: Game[], group: number): Validation | undefined {
    const invalidCombinations = games.filter((game, index) =>
      games.some(
        (otherMatch, idx) =>
          ((otherMatch.team.teamId === game.team.teamId && otherMatch.opponent.teamId === game.opponent.teamId) ||
            (otherMatch.team.teamId === game.opponent.teamId && otherMatch.opponent.teamId === game.team.teamId)) &&
          index !== idx
      )
    );
    if (invalidCombinations.length > 0) {
      return { message: ValidationMessage.InvalidCombinationOfTeams, group, games: invalidCombinations };
    }
    return undefined;
  }

  private getTeamIds(games: Game[]): string[] {
    return games.flatMap((game) => compact([game.team.teamId, game.opponent.teamId]));
  }

  private calculateGamePermutations(numberOfTeams: number): number {
    return this.factorialize(numberOfTeams) / (this.factorialize(numberOfTeams - 2) * 2);
  }

  private factorialize(num: number): number {
    if (num < 0) return -1;
    else if (num == 0) return 1;
    else {
      return num * this.factorialize(num - 1);
    }
  }
}
