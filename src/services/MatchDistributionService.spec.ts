import { MatchDistributionService } from './MatchDistributionService';
import { MatchValidationService, ValidationMessage } from './MatchValidationService';
import { anything, instance, mock, when } from 'ts-mockito';
import {
  buildGroupFromTeams,
  buildMatchCombinations,
  buildRandomMatchPlan,
  buildRandomTeams,
  initialMatchCombinations,
  initialMatchCombinationsWithSlots,
  removePropertyFromAllEntries,
} from '../testData';
import { MatchPlan } from '../models/Game';
import { groupBy, uniq } from 'lodash';

const isMatchPlanValid = (matchPlan: MatchPlan, numberOfParallelGames: number): boolean =>
  Object.values(groupBy(matchPlan, 'slot'))
    .map((games) => games.flatMap((game) => [game.team.teamId, game.opponent.teamId]))
    .every((ids) => ids.length === 2 || uniq(ids).length === numberOfParallelGames * 2);

describe('MatchDistributionService', () => {
  let matchDistributionService: MatchDistributionService;
  let matchValidationService: MatchValidationService;

  beforeEach(() => {
    matchValidationService = mock(MatchValidationService);
    matchDistributionService = new MatchDistributionService(instance(matchValidationService));
  });

  describe('generateOptimizedMatchPlan', () => {
    test('to return empty match plan if no groups available', () => {
      const result = matchDistributionService.generateOptimizedMatchPlan([]);
      expect(result.length).toBe(0);
    });

    describe('all teams in one group', () => {
      const numberOfGroups = 1;
      test.each([
        [4, 6],
        [8, 28],
        [17, 136],
      ])('to create a match plan for %i teams with %i matches ', (numberOfTeams, expectedLength) => {
        const randomTeams = buildRandomTeams(numberOfTeams);
        const groups = [buildGroupFromTeams(randomTeams, numberOfGroups)];
        const result = matchDistributionService.generateOptimizedMatchPlan(groups);
        expect(result.length).toBe(expectedLength);
      });

      test.each([0, 1])('that for %i teams no matches are created', (numberOfTeams) => {
        const randomTeams = buildRandomTeams(numberOfTeams);
        const groups = [buildGroupFromTeams(randomTeams, numberOfGroups)];
        const result = matchDistributionService.generateOptimizedMatchPlan(groups);
        expect(result.length).toBe(0);
      });

      test('to create a match plan for 4 teams in correct order', () => {
        const randomTeams = buildRandomTeams(4);
        const groups = [buildGroupFromTeams(randomTeams, numberOfGroups)];
        const expectedMatchPlan = buildMatchCombinations(randomTeams, [
          { teamIndex: 0, opponentIndex: 1, groupNumber: 1, gameNumber: 1 },
          { teamIndex: 2, opponentIndex: 3, groupNumber: 1, gameNumber: 2 },
          { teamIndex: 0, opponentIndex: 2, groupNumber: 1, gameNumber: 3 },
          { teamIndex: 1, opponentIndex: 3, groupNumber: 1, gameNumber: 4 },
          { teamIndex: 0, opponentIndex: 3, groupNumber: 1, gameNumber: 5 },
          { teamIndex: 1, opponentIndex: 2, groupNumber: 1, gameNumber: 6 },
        ]);
        const result = matchDistributionService.generateOptimizedMatchPlan(groups);
        expect(removePropertyFromAllEntries(result, 'gameId')).toEqual(
          removePropertyFromAllEntries(expectedMatchPlan, 'gameId')
        );
      });
    });

    describe('teams split in two groups', () => {
      const numberOfGroups = 2;
      test.each([
        [8, 12],
        [17, 64],
      ])('to create a match plan for %i teams with %i matches ', (numberOfTeams, expectedLength) => {
        const randomTeams = buildRandomTeams(numberOfTeams);
        const teamsOfGroupOne = randomTeams.slice(0, randomTeams.length / numberOfGroups);
        const teamsOfGroupTwo = randomTeams.slice(randomTeams.length / numberOfGroups);
        const groups = [buildGroupFromTeams(teamsOfGroupOne, 1), buildGroupFromTeams(teamsOfGroupTwo, 2)];
        const result = matchDistributionService.generateOptimizedMatchPlan(groups);
        expect(result.length).toBe(expectedLength);
      });

      test.each([0, 1, 2, 3])('that a for %i teams no matches are created', (numberOfTeams) => {
        const randomTeams = buildRandomTeams(numberOfTeams);
        const teamsOfGroupOne = randomTeams.slice(0, randomTeams.length / numberOfGroups);
        const teamsOfGroupTwo = randomTeams.slice(randomTeams.length / numberOfGroups);
        const groups = [buildGroupFromTeams(teamsOfGroupOne, 1), buildGroupFromTeams(teamsOfGroupTwo, 2)];
        const result = matchDistributionService.generateOptimizedMatchPlan(groups);
        expect(result.length).toBe(0);
      });

      test('to create a match plan for 4 teams in each group in correct order', () => {
        const randomTeams = buildRandomTeams(8);
        const teamsOfGroupOne = randomTeams.slice(0, randomTeams.length / numberOfGroups);
        const teamsOfGroupTwo = randomTeams.slice(randomTeams.length / numberOfGroups);
        const groups = [buildGroupFromTeams(teamsOfGroupOne, 1), buildGroupFromTeams(teamsOfGroupTwo, 2)];

        const expectedMatchPlan = buildMatchCombinations(randomTeams, [
          { teamIndex: 0, opponentIndex: 1, groupNumber: 1, gameNumber: 1 },
          { teamIndex: 4, opponentIndex: 5, groupNumber: 2, gameNumber: 1 },
          { teamIndex: 2, opponentIndex: 3, groupNumber: 1, gameNumber: 2 },
          { teamIndex: 6, opponentIndex: 7, groupNumber: 2, gameNumber: 2 },
          { teamIndex: 0, opponentIndex: 2, groupNumber: 1, gameNumber: 3 },
          { teamIndex: 4, opponentIndex: 6, groupNumber: 2, gameNumber: 3 },
          { teamIndex: 1, opponentIndex: 3, groupNumber: 1, gameNumber: 4 },
          { teamIndex: 5, opponentIndex: 7, groupNumber: 2, gameNumber: 4 },
          { teamIndex: 0, opponentIndex: 3, groupNumber: 1, gameNumber: 5 },
          { teamIndex: 4, opponentIndex: 7, groupNumber: 2, gameNumber: 5 },
          { teamIndex: 1, opponentIndex: 2, groupNumber: 1, gameNumber: 6 },
          { teamIndex: 5, opponentIndex: 6, groupNumber: 2, gameNumber: 6 },
        ]);

        const result = matchDistributionService.generateOptimizedMatchPlan(groups);
        expect(removePropertyFromAllEntries(result, 'gameId')).toEqual(
          removePropertyFromAllEntries(expectedMatchPlan, 'gameId')
        );
      });
    });
  });

  describe('distributeMatchSlots', () => {
    test('to throw an error if match plan is already invalid', () => {
      const invalidMatchPlan: MatchPlan = [];
      when(matchValidationService.validateMatchPlan(anything())).thenReturn([
        { message: ValidationMessage.EmptyMatchPlan, games: [] },
      ]);
      expect(() => matchDistributionService.distributeMatchSlots(invalidMatchPlan, anything())).toThrow(
        'Validation failed'
      );
    });

    describe('All teams in one group', () => {
      const numberOfGroups = 1;
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
        const matchPlan = buildMatchCombinations(teams, initialMatchCombinations[teams.length][numberOfGroups]);
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
        const initialMatchPlan = buildMatchCombinations(teams, initialMatchCombinations[numberOfTeams][numberOfGroups]);

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

      test.each([
        [1, 6],
        [1, 9],
        [1, 56],
        [2, 6],
        [2, 9],
        [2, 56],
      ])(
        'to create a valid match plan for %i pitches to play with %i teams in one group',
        (numberOfPitches, numberOfTeams) => {
          const initialMatchPlan = buildRandomMatchPlan(buildRandomTeams(numberOfTeams));

          when(matchValidationService.validateMatchPlan(anything())).thenReturn([]);
          when(matchValidationService.validateSlotCombinations(anything())).thenReturn(false);
          when(matchValidationService.listInvalidSlotCombinations(anything())).thenReturn([]);

          const result = matchDistributionService
            .distributeMatchSlots(initialMatchPlan, numberOfPitches)
            .sort((a, b) => a!.slot! - b!.slot!);

          expect(isMatchPlanValid(result, numberOfPitches)).toBe(true);
        }
      );

      test.each([
        [1, 2],
        [1, 3],
        [1, 4],
        [2, 4],
        [1, 5],
        [2, 5],
      ])(
        'to distribute games to correct slots with %i pitches to play with %i teams in one group',
        (numberOfPitches, numberOfTeams) => {
          const teams = buildRandomTeams(numberOfTeams);
          const initialMatchPlan = buildMatchCombinations(
            teams,
            initialMatchCombinations[numberOfTeams][numberOfGroups]
          );
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

          expect(isMatchPlanValid(result, numberOfPitches)).toBe(true);

          expect(removePropertyFromAllEntries(result, 'gameId')).toStrictEqual(
            removePropertyFromAllEntries(expectedMatchPlan, 'gameId')
          );
        }
      );
    });

    describe('All teams in two groups', () => {
      const numberOfGroups = 2;
      beforeEach(() => {
        when(matchValidationService.validateMatchPlan(anything())).thenReturn([]);
      });

      test('to distribute games correctly with one pitch to play ', () => {
        const numberOfTeams = 4;
        const numberOfPitches = 1;
        const teams = buildRandomTeams(numberOfTeams);
        const matchPlan = buildMatchCombinations(teams, initialMatchCombinations[numberOfTeams][numberOfGroups]);

        const expectedMatchPlan = buildMatchCombinations(teams, [
          { teamIndex: 0, opponentIndex: 1, groupNumber: 1, gameNumber: 1, slot: 1 },
          { teamIndex: 2, opponentIndex: 3, groupNumber: 2, gameNumber: 2, slot: 2 },
        ]);

        when(matchValidationService.validateSlotCombinations(anything())).thenReturn(true);
        const result = matchDistributionService.distributeMatchSlots(matchPlan, numberOfPitches);

        expect(removePropertyFromAllEntries(result, 'gameId')).toStrictEqual(
          removePropertyFromAllEntries(expectedMatchPlan, 'gameId')
        );
      });

      test('to distribute games correctly with two pitches to play ', () => {
        const numberOfTeams = 4;
        const numberOfPitches = 2;
        const teams = buildRandomTeams(numberOfTeams);
        const matchPlan = buildMatchCombinations(teams, initialMatchCombinations[numberOfTeams][numberOfGroups]);
        const expectedMatchPlan = buildMatchCombinations(teams, [
          { teamIndex: 0, opponentIndex: 1, groupNumber: 1, gameNumber: 1, slot: 1 },
          { teamIndex: 2, opponentIndex: 3, groupNumber: 2, gameNumber: 2, slot: 1 },
        ]);
        when(matchValidationService.validateSlotCombinations(anything())).thenReturn(true);
        const result = matchDistributionService.distributeMatchSlots(matchPlan, numberOfPitches);

        expect(removePropertyFromAllEntries(result, 'gameId')).toStrictEqual(
          removePropertyFromAllEntries(expectedMatchPlan, 'gameId')
        );
      });

      test('to distribute games correctly with two pitches to play but insufficient number of teams in one group', () => {
        const numberOfTeams = 5;
        const numberOfPitches = 2;
        const teams = buildRandomTeams(numberOfTeams);
        const initialMatchPlan = buildMatchCombinations(teams, initialMatchCombinations[numberOfTeams][numberOfGroups]);

        const expectedMatchPlan = buildMatchCombinations(teams, [
          { teamIndex: 0, opponentIndex: 1, groupNumber: 1, gameNumber: 1, slot: 1 },
          { teamIndex: 3, opponentIndex: 4, groupNumber: 2, gameNumber: 2, slot: 1 },
          { teamIndex: 0, opponentIndex: 2, groupNumber: 1, gameNumber: 3, slot: 2 },
          { teamIndex: 1, opponentIndex: 2, groupNumber: 1, gameNumber: 4, slot: 3 },
        ]);
        when(matchValidationService.validateSlotCombinations(anything())).thenReturn(false);
        when(matchValidationService.listInvalidSlotCombinations(anything())).thenReturn([]);
        const result = matchDistributionService.distributeMatchSlots(initialMatchPlan, numberOfPitches);

        expect(removePropertyFromAllEntries(result, 'gameId')).toStrictEqual(
          removePropertyFromAllEntries(expectedMatchPlan, 'gameId')
        );
      });
    });
  });
});
