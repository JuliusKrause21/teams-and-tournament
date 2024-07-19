import { Container } from 'inversify';
import { Database } from './Database';
import { TeamService } from './services/TeamService';
import { MatchService } from './services/MatchService';
import { TeamRepository } from './repositories/TeamRepository';
import { MatchRepository } from './repositories/entities/MatchRepository';

export const container = new Container();

// db
container.bind<Database>(Database).toSelf().inSingletonScope();

// repositories
container.bind<TeamRepository>(TeamRepository).toSelf().inSingletonScope();
container.bind<MatchRepository>(MatchRepository).toSelf().inSingletonScope();

container.bind<TeamService>(TeamService).toSelf().inSingletonScope();
container.bind<MatchService>(MatchService).toSelf().inSingletonScope();
