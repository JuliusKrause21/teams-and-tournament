import { ObjectId } from 'mongodb';
import { TaskType } from '../../models/Task';

export class TaskEntity {
  public _id?: ObjectId;
  public type: TaskType;
  public due_date: string;
  public assigned: string[];
  public number_of_needs: number;
  constructor(type: TaskType, due_date: string, assigned: string[], number_of_needs: number) {
    this.type = type;
    this.due_date = due_date;
    this.assigned = assigned;
    this.number_of_needs = number_of_needs;
  }
}
