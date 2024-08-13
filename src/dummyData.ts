export const gameDate = '2024-09-02T08:19:34.277Z';

export const games: Game[] = [
  {
    id: '1',
    date: gameDate,
    type: 'home',
    availablePlayers: ['Julius', 'Moritz', 'Kimberly'],
  },
];

export interface Game {
  id: string;
  date: string;
  type: string;
  availablePlayers: string[];
}

export interface Player {
  name: string;
  available: string[];
}

export const players: Player[] = [
  {
    name: 'Julius',
    available: [],
  },
  {
    name: 'Moritz',
    available: [],
  },
];
