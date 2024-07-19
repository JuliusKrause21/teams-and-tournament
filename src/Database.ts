import { Db, MongoClient } from 'mongodb';

export class Database {
  constructor(private readonly uri: string) {}
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

  public async getDb(): Promise<Db> {
    await this.connect(this.uri);
    if (this.mongoClient === undefined) {
      throw new Error('Trying to access DB before establishing connection');
    }
    return this.mongoClient.db();
  }
}
