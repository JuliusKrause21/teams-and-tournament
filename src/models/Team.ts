export interface Team {
  name: string;
  teamId?: string;
  group?: number;
}

export interface Group {
  number: number;
  teams: Team[];
}

export type TeamQueryOptions = Pick<Team, 'group'>;

export function isTeamQueryOption(query: unknown): query is TeamQueryOptions {
  return typeof query === 'object' && (query as TeamQueryOptions).group !== undefined;
}
