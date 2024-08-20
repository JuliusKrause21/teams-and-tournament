import { Container, inject, injectable } from 'inversify';
import { Server } from './Server';
import { Database } from './Database';
import { Scheduler } from './Scheduler';

@injectable()
export class Application {
  constructor(
    @inject(Server) private readonly server: Server,
    @inject(Scheduler) private readonly scheduler: Scheduler
  ) {}
  public static async startup(container: Container): Promise<void> {
    const uri = 'mongodb://localhost:27017/test';

    const db = container.get(Database);
    await db.connect(uri);

    // This can be moved to a separate file
    // await db.getCollection('teams').createIndex('name', { name: 'name_1', unique: true });

    const application = container.get(Application);

    /*
    This is crucial, because static methods can not use injected instances.
    The workaround is to get an injected instance of itself and call another non-static method on it.
    Getting the container of the Application in index.ts does not work since the database connection is tried to
    establish too soon and everytime an instance of the Application is injected
     */
    try {
      await application.startScheduler();
      await application.startExpressServer();
    } catch (error) {
      console.log('Failed to start express server');
    }
  }

  private async startExpressServer() {
    await this.server.start();
  }

  private async startScheduler() {
    await this.scheduler.start();
  }
}
