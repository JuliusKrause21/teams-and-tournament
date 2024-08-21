export interface Team {
  name: string;
  teamId?: string;
  group?: number;
}

export interface Group {
  number: number;
  teams: Team[];
}
