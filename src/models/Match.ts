export interface Match {
  day: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  location: string;
  availablePlayers: string[];
}
export type MatchQueryOptions = Pick<Match, 'date'>;

export function isMatchQueryOption(query: unknown): query is MatchQueryOptions {
  return typeof query === 'object' && (query as MatchQueryOptions).date !== undefined;
}
