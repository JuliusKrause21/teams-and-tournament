export enum TaskType {
  Simple = 'simple',
  Complex = 'complex',
}

export interface Task {
  type: TaskType;
  dueDate: string;
  assignedPlayers: string[];
  numberOfNeeds: number;
}

export type TaskQueryOptions = Pick<Task, 'dueDate'>;
