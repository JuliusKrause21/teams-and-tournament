import { MatchDistributionService } from './MatchDistributionService';
import { MatchValidationService, ValidationMessage } from './MatchValidationService';
import { anything, instance, mock, when } from 'ts-mockito';
import { MatchPlan } from '../models/Game';
import {
  buildMatchCombinations,
  buildRandomTeams,
  initialMatchCombinations,
  initialMatchCombinationsWithSlots,
  removePropertyFromAllEntries,
} from '../testData';

describe('MatchDistributionService', () => {
  let matchDistributionService: MatchDistributionService;
  let matchValidationService: MatchValidationService;

  beforeEach(() => {
    matchValidationService = mock(MatchValidationService);
    matchDistributionService = new MatchDistributionService(instance(matchValidationService));
  });

  describe('distributeMatchSlots', () => {
    test('to throw an error if match plan is already invalid', () => {
      const invalidMatchPlan: MatchPlan = [];
      when(matchValidationService.validateMatchPlan(anything())).thenReturn([
        { message: ValidationMessage.EmptyMatchPlan, games: [] },
      ]);
      expect(matchDistributionService.distributeMatchSlots(invalidMatchPlan, anything())).toThrow('Validation failed');
    });
    test('to distribute games correctly with one pitch to play ', () => {
      const teams = buildRandomTeams(3);
      const matchPlan = buildMatchCombinations(teams, [
        { teamIndex: 0, opponentIndex: 1, groupNumber: 1, gameNumber: 1 },
        { teamIndex: 1, opponentIndex: 2, groupNumber: 1, gameNumber: 2 },
        { teamIndex: 0, opponentIndex: 2, groupNumber: 1, gameNumber: 3 },
      ]);
      const expectedMatchPlan = buildMatchCombinations(teams, [
        { teamIndex: 0, opponentIndex: 1, groupNumber: 1, gameNumber: 1, slot: 1 },
        { teamIndex: 1, opponentIndex: 2, groupNumber: 1, gameNumber: 2, slot: 2 },
        { teamIndex: 0, opponentIndex: 2, groupNumber: 1, gameNumber: 3, slot: 3 },
      ]);
      when(matchValidationService.validateMatchPlan(anything())).thenReturn([]);
      when(matchValidationService.validateSlotCombinations(anything())).thenReturn(true);
      const result = matchDistributionService.distributeMatchSlots(matchPlan, 1);

      expect(removePropertyFromAllEntries(result, 'gameId')).toStrictEqual(
        removePropertyFromAllEntries(expectedMatchPlan, 'gameId')
      );
    });

    test('to distribute games correctly with two pitches to play', () => {
      const teams = buildRandomTeams(4);
      const matchPlan = buildMatchCombinations(teams, initialMatchCombinations[teams.length]);
      const expectedMatchPlan = buildMatchCombinations(teams, [
        { teamIndex: 0, opponentIndex: 1, groupNumber: 1, gameNumber: 1, slot: 1 },
        { teamIndex: 2, opponentIndex: 3, groupNumber: 1, gameNumber: 2, slot: 1 },
        { teamIndex: 0, opponentIndex: 2, groupNumber: 1, gameNumber: 3, slot: 2 },
        { teamIndex: 1, opponentIndex: 3, groupNumber: 1, gameNumber: 4, slot: 2 },
        { teamIndex: 0, opponentIndex: 3, groupNumber: 1, gameNumber: 5, slot: 3 },
        { teamIndex: 1, opponentIndex: 2, groupNumber: 1, gameNumber: 6, slot: 3 },
      ]);
      when(matchValidationService.validateMatchPlan(anything())).thenReturn([]);
      when(matchValidationService.validateSlotCombinations(anything())).thenReturn(true);
      const result = matchDistributionService.distributeMatchSlots(matchPlan, 2);

      expect(removePropertyFromAllEntries(result, 'gameId')).toStrictEqual(
        removePropertyFromAllEntries(expectedMatchPlan, 'gameId')
      );
    });

    test('to distribute games correctly with two pitches to play but insufficient number of teams', () => {
      const numberOfTeams = 3;
      const numberOfPitches = 2;
      const teams = buildRandomTeams(numberOfTeams);
      const initialMatchPlan = buildMatchCombinations(teams, initialMatchCombinations[numberOfTeams]);

      const expectedMatchPlan = buildMatchCombinations(teams, [
        { teamIndex: 0, opponentIndex: 1, groupNumber: 1, gameNumber: 1, slot: 1 },
        { teamIndex: 1, opponentIndex: 2, groupNumber: 1, gameNumber: 2, slot: 2 },
        { teamIndex: 0, opponentIndex: 2, groupNumber: 1, gameNumber: 3, slot: 3 },
      ]);
      when(matchValidationService.validateMatchPlan(anything())).thenReturn([]);
      when(matchValidationService.validateSlotCombinations(anything())).thenReturn(false);
      when(matchValidationService.listInvalidSlotCombinations(anything())).thenReturn([]);
      const result = matchDistributionService.distributeMatchSlots(initialMatchPlan, numberOfPitches);

      expect(removePropertyFromAllEntries(result, 'gameId')).toStrictEqual(
        removePropertyFromAllEntries(expectedMatchPlan, 'gameId')
      );
    });

    test('to distribute games correctly with two pitches to play with sufficient number of teams in one group', () => {
      const numberOfTeams = 5;
      const numberOfPitches = 2;
      const teams = buildRandomTeams(numberOfTeams);
      const initialMatchPlan = buildMatchCombinations(teams, initialMatchCombinations[numberOfTeams]);

      const expectedMatchPlan = buildMatchCombinations(
        teams,
        initialMatchCombinationsWithSlots[numberOfTeams][numberOfPitches],
        initialMatchPlan.map((game) => game.gameId)
      );
      when(matchValidationService.validateMatchPlan(anything())).thenReturn([]);
      when(matchValidationService.validateSlotCombinations(anything())).thenReturn(false);
      when(matchValidationService.listInvalidSlotCombinations(anything())).thenReturn([]);
      const result = matchDistributionService
        .distributeMatchSlots(initialMatchPlan, numberOfPitches)
        .sort((a, b) => a!.slot! - b!.slot!);

      expect(removePropertyFromAllEntries(result, 'gameId')).toStrictEqual(
        removePropertyFromAllEntries(expectedMatchPlan, 'gameId')
      );
    });
  });
});
