import { ObjectId } from 'mongodb';

export class MatchEntity {
  constructor(
    public _id: ObjectId,
    public date: number
  ) {}
}
