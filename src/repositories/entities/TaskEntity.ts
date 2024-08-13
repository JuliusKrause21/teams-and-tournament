import { ObjectId } from 'mongodb';
import { v4 as uuid } from 'uuid';
import { TaskType } from '../../models/Task';

export class TaskEntity {
  public _id?: ObjectId;
  public type: TaskType;
  public description: string;
  public due_date: string;
  public assigned: string[];
  public number_of_needs: number;
  public last_modified?: string;
  public task_id?: string;
  public resolved?: boolean;
  constructor({
    type,
    description,
    due_date,
    assigned = [],
    number_of_needs = 1,
    last_modified = new Date().toISOString(),
    task_id = uuid(),
    resolved = false,
  }: {
    type: TaskType;
    description: string;
    due_date: string;
    assigned?: string[];
    number_of_needs?: number;
    last_modified?: string;
    task_id?: string;
    resolved?: boolean;
  }) {
    this.type = type;
    this.description = description;
    this.due_date = due_date;
    this.assigned = assigned;
    this.number_of_needs = number_of_needs;
    this.last_modified = last_modified;
    this.task_id = task_id;
    this.resolved = resolved;
  }
}
