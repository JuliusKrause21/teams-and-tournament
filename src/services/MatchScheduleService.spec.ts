import {
  buildGroupFromTeams,
  buildMatchCombinations,
  buildRandomTeams,
  removePropertyFromAllEntries,
} from '../testData';
import { MatchScheduleService } from './MatchScheduleService';

describe('MatchScheduleService', () => {
  let matchScheduleService: MatchScheduleService;

  beforeEach(() => {
    matchScheduleService = new MatchScheduleService();
  });

  describe('setupMatchPlan', () => {
    test('to return empty match plan if no groups available', () => {
      const result = matchScheduleService.setupMatchPlan([]);
      expect(result.length).toBe(0);
    });

    describe('all teams in one group', () => {
      const numberOfGroups = 1;
      test.each([
        [8, 28],
        [17, 136],
        [46, 1035],
        [67, 2211],
      ])('to create a match plan for %i teams with %i matches ', (numberOfTeams, expectedLength) => {
        const randomTeams = buildRandomTeams(numberOfTeams);
        const groups = [buildGroupFromTeams(randomTeams, numberOfGroups)];
        const result = matchScheduleService.setupMatchPlan(groups);
        expect(result.length).toBe(expectedLength);
      });

      test.each([0, 1])('that a for %i teams no matches are created', (numberOfTeams) => {
        const randomTeams = buildRandomTeams(numberOfTeams);
        const groups = [buildGroupFromTeams(randomTeams, numberOfGroups)];
        const result = matchScheduleService.setupMatchPlan(groups);
        expect(result.length).toBe(0);
      });

      test('to create a match plan with 4 teams', () => {
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
        const result = matchScheduleService.setupMatchPlan(groups);
        expect(removePropertyFromAllEntries(result, 'gameId')).toStrictEqual(
          removePropertyFromAllEntries(expectedMatchPlan, 'gameId')
        );
      });
    });

    describe('teams split in two groups', () => {
      const numberOfGroups = 2;
      test.each([
        [8, 12],
        [17, 64],
        [46, 506],
        [67, 1089],
      ])('to create a match plan for %i teams with %i matches ', (numberOfTeams, expectedLength) => {
        const randomTeams = buildRandomTeams(numberOfTeams);
        const teamsOfGroupOne = randomTeams.slice(0, randomTeams.length / numberOfGroups);
        const teamsOfGroupTwo = randomTeams.slice(randomTeams.length / numberOfGroups);
        const groups = [buildGroupFromTeams(teamsOfGroupOne, 1), buildGroupFromTeams(teamsOfGroupTwo, 2)];
        const result = matchScheduleService.setupMatchPlan(groups);
        expect(result.length).toBe(expectedLength);
      });

      test.each([0, 1, 2, 3])('that a for %i teams no matches are created', (numberOfTeams) => {
        const randomTeams = buildRandomTeams(numberOfTeams);
        const teamsOfGroupOne = randomTeams.slice(0, randomTeams.length / numberOfGroups);
        const teamsOfGroupTwo = randomTeams.slice(randomTeams.length / numberOfGroups);
        const groups = [buildGroupFromTeams(teamsOfGroupOne, 1), buildGroupFromTeams(teamsOfGroupTwo, 2)];
        const result = matchScheduleService.setupMatchPlan(groups);
        expect(result.length).toBe(0);
      });

      test('to create a match plan with 4 teams in each group', () => {
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

        const result = matchScheduleService.setupMatchPlan(groups);
        expect(removePropertyFromAllEntries(result, 'gameId')).toStrictEqual(
          removePropertyFromAllEntries(expectedMatchPlan, 'gameId')
        );
      });
    });
  });
});
