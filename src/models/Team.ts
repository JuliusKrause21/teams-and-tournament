import { TeamEntity } from '../repositories/entities/TeamEntity';

export interface Team {
  name: string;
  teamId?: string;
  group?: number;
}

export interface Group {
  number: number;
  teams: Team[];
}

export function mapTeamEntityToTeam(teamEntity: TeamEntity): Team {
  return {
    teamId: teamEntity.team_id,
    group: teamEntity.group,
    name: teamEntity.name,
  };
}

export type TeamInfo = Required<Pick<Team, 'name' | 'teamId'>>;

export type TeamQueryOptions = Pick<Team, 'group'>;

export function isTeamQueryOption(query: unknown): query is TeamQueryOptions {
  return typeof query === 'object' && (query as TeamQueryOptions).group !== undefined;
}
