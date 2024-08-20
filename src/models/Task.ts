export enum TaskType {
  Simple = 'simple',
  Complex = 'complex',
}

export interface Task {
  type: TaskType;
  taskId: string | undefined;
  description: string;
  dueDate: string;
  assignedPlayers: string[];
  numberOfNeeds: number;
}

export type TaskQueryOptions = Pick<Task, 'dueDate'>;

export function isTaskQueryOption(query: unknown): query is TaskQueryOptions {
  return typeof query === 'object' && (query as TaskQueryOptions).dueDate !== undefined;
}
