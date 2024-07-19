import { Container } from 'inversify';
import { Database } from './Database';

export const container = new Container();

// db
container.bind<Database>(Database).toSelf().inSingletonScope();
