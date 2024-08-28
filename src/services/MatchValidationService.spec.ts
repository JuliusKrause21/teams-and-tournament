import { MatchValidationService, Validation, ValidationMessage } from './MatchValidationService';
import { buildMatchCombinations, buildRandomTeams } from '../testData';

describe('MatchValidationService', () => {
  let matchValidationService: MatchValidationService;

  beforeEach(() => {
    matchValidationService = new MatchValidationService();
  });

  describe('validateMatchPlan', () => {
    test('to mark match plan invalid if it contains no games', () => {
      const expectedValidation: Validation = { message: ValidationMessage.EmptyMatchPlan, games: [] };
      const result = matchValidationService.validateMatchPlan([]);
      expect(result).toStrictEqual([expectedValidation]);
    });

    test('to invalidate match plan if a team is part of more than one group', () => {
      const teamsOfGroupOne = buildRandomTeams(3);
      const matchPlanGroupOne = buildMatchCombinations(teamsOfGroupOne, [
        { teamIndex: 0, opponentIndex: 1, groupNumber: 1, gameNumber: 1 },
        { teamIndex: 1, opponentIndex: 2, groupNumber: 1, gameNumber: 2 },
        { teamIndex: 0, opponentIndex: 2, groupNumber: 1, gameNumber: 3 },
      ]);

      const matchPlanGroupTwo = buildMatchCombinations(
        [teamsOfGroupOne[0], ...buildRandomTeams(2)],
        [
          { teamIndex: 0, opponentIndex: 1, groupNumber: 2, gameNumber: 1 },
          { teamIndex: 1, opponentIndex: 2, groupNumber: 2, gameNumber: 2 },
          { teamIndex: 0, opponentIndex: 2, groupNumber: 2, gameNumber: 3 },
        ]
      );
      const expectedValidation: Validation = {
        message: ValidationMessage.InvalidDistributionOfTeams,
        teamIds: [teamsOfGroupOne[0].teamId ?? ''],
        games: [],
      };
      const result = matchValidationService.validateMatchPlan([...matchPlanGroupOne, ...matchPlanGroupTwo]);
      expect(result).toStrictEqual([expectedValidation]);
    });

    test('to invalidate match plan if games in one group do not match', () => {
      const matchPlanGroupOne = buildMatchCombinations(buildRandomTeams(3), [
        { teamIndex: 0, opponentIndex: 1, groupNumber: 1, gameNumber: 1 },
        { teamIndex: 1, opponentIndex: 2, groupNumber: 1, gameNumber: 2 },
        { teamIndex: 0, opponentIndex: 2, groupNumber: 1, gameNumber: 3 },
      ]);

      const matchPlanGroupTwo = buildMatchCombinations(buildRandomTeams(3), [
        { teamIndex: 0, opponentIndex: 1, groupNumber: 2, gameNumber: 1 },
        { teamIndex: 1, opponentIndex: 2, groupNumber: 2, gameNumber: 2 },
        { teamIndex: 0, opponentIndex: 2, groupNumber: 2, gameNumber: 3 },
      ]).slice(1);

      const expectedValidation: Validation = {
        message: ValidationMessage.InvalidNumberOfGamesInGroup,
        group: 2,
        games: matchPlanGroupTwo,
      };
      const result = matchValidationService.validateMatchPlan([...matchPlanGroupOne, ...matchPlanGroupTwo]);
      expect(result).toStrictEqual([expectedValidation]);
    });

    test('to invalidate match plan if games in both group do not match', () => {
      const matchPlanGroupOne = buildMatchCombinations(buildRandomTeams(3), [
        { teamIndex: 0, opponentIndex: 1, groupNumber: 1, gameNumber: 1 },
        { teamIndex: 1, opponentIndex: 2, groupNumber: 1, gameNumber: 2 },
        { teamIndex: 0, opponentIndex: 2, groupNumber: 1, gameNumber: 3 },
      ]).slice(1);

      const matchPlanGroupTwo = buildMatchCombinations(buildRandomTeams(3), [
        { teamIndex: 0, opponentIndex: 1, groupNumber: 2, gameNumber: 1 },
        { teamIndex: 1, opponentIndex: 2, groupNumber: 2, gameNumber: 2 },
        { teamIndex: 0, opponentIndex: 2, groupNumber: 2, gameNumber: 3 },
      ]).slice(1);

      const expectedValidation: Validation[] = [
        {
          message: ValidationMessage.InvalidNumberOfGamesInGroup,
          group: 1,
          games: matchPlanGroupOne,
        },
        {
          message: ValidationMessage.InvalidNumberOfGamesInGroup,
          group: 2,
          games: matchPlanGroupTwo,
        },
      ];
      const result = matchValidationService.validateMatchPlan([...matchPlanGroupOne, ...matchPlanGroupTwo]);
      expect(result).toStrictEqual(expectedValidation);
    });

    test('to invalidate match plan if both teams of a game have equal ids', () => {
      const matchPlan = buildMatchCombinations(buildRandomTeams(3), [
        { teamIndex: 0, opponentIndex: 1, groupNumber: 1, gameNumber: 1 },
        { teamIndex: 1, opponentIndex: 1, groupNumber: 1, gameNumber: 2 },
        { teamIndex: 0, opponentIndex: 2, groupNumber: 1, gameNumber: 3 },
      ]);
      const expectedValidation: Validation = {
        message: ValidationMessage.EqualIds,
        group: 1,
        games: [matchPlan[1]],
      };

      const result = matchValidationService.validateMatchPlan(matchPlan);
      expect(result).toStrictEqual([expectedValidation]);
    });

    test('to invalidate match plan if combination of teams is invalid', () => {
      const matchPlanGroupOne = buildMatchCombinations(buildRandomTeams(3), [
        { teamIndex: 0, opponentIndex: 1, groupNumber: 1, gameNumber: 1 },
        { teamIndex: 1, opponentIndex: 2, groupNumber: 1, gameNumber: 2 },
        { teamIndex: 1, opponentIndex: 2, groupNumber: 1, gameNumber: 3 },
      ]);
      const matchPlanGroupTwo = buildMatchCombinations(buildRandomTeams(3), [
        { teamIndex: 0, opponentIndex: 1, groupNumber: 2, gameNumber: 1 },
        { teamIndex: 1, opponentIndex: 2, groupNumber: 2, gameNumber: 2 },
        { teamIndex: 2, opponentIndex: 1, groupNumber: 2, gameNumber: 3 },
      ]);
      const expectedValidation: Validation[] = [
        {
          message: ValidationMessage.InvalidCombinationOfTeams,
          group: 1,
          games: [matchPlanGroupOne[1], matchPlanGroupOne[2]],
        },
        {
          message: ValidationMessage.InvalidCombinationOfTeams,
          group: 2,
          games: [matchPlanGroupTwo[1], matchPlanGroupTwo[2]],
        },
      ];

      const result = matchValidationService.validateMatchPlan([...matchPlanGroupOne, ...matchPlanGroupTwo]);
      expect(result).toStrictEqual(expectedValidation);
    });
  });
});
