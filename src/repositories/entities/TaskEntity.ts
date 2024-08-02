import { ObjectId } from 'mongodb';
import { TaskType } from '../../models/Task';

export class TaskEntity {
  public _id?: ObjectId;
  public type: TaskType;
  public due_date: string;
  public assigned: string[];
  public number_of_needs: number;
  public last_modified?: string;
  constructor({
    type,
    due_date,
    assigned = [],
    number_of_needs,
    last_modified = new Date().toISOString(),
  }: {
    type: TaskType;
    due_date: string;
    assigned: string[];
    number_of_needs: number;
    last_modified?: string;
  }) {
    this.type = type;
    this.due_date = due_date;
    this.assigned = assigned;
    this.number_of_needs = number_of_needs;
    this.last_modified = last_modified;
  }
}
