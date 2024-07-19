import { Db, MongoClient } from 'mongodb';
import { injectable } from 'inversify';

@injectable()
export class Database {
  private mongoClient: MongoClient | undefined;

  public async connect(uri: string): Promise<void> {
    if (this.mongoClient !== undefined) {
      return;
    }
    this.mongoClient = new MongoClient(uri);
    console.log('Connecting DB ...');
    await this.mongoClient.connect();
    console.log('Database connection established');
  }

  public getDb(): Db {
    if (this.mongoClient === undefined) {
      throw new Error('Trying to access DB before establishing connection');
    }
    return this.mongoClient.db();
  }
}
