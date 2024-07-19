import { ObjectId } from 'mongodb';

export class TeamEntity {
  constructor(
    public _id: ObjectId,
    public name: string
  ) {}
}
