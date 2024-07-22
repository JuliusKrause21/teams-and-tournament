import { Container, inject, injectable } from 'inversify';
import { Server } from './Server';
import { Database } from './Database';

@injectable()
export class Application {
  constructor(@inject(Server) private readonly server: Server) {}
  public static async startup(container: Container): Promise<void> {
    const uri = 'mongodb://localhost:27017/test';

    const db = container.get(Database);
    await db.connect(uri);

    const application = container.get(Application);

    /*
    This is crucial, because static methods can not use injected instances.
    The workaround is to get an injected instance of itself and call another non-static method on it.
    Getting the container of the Application in index.ts does not work since the database connection is tried to
    establish too soon and everytime an instance of the Application is injected
     */
    application.startExpressServer();
  }

  private startExpressServer() {
    this.server.start();
  }
}
