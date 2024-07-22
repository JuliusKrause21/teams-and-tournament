import { ObjectId } from 'mongodb';

export class TeamEntity {
  public _id?: ObjectId;
  public name: string;
  constructor(name: string) {
    this.name = name;
  }
}
