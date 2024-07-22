import { Container } from 'inversify';
import { Database } from './Database';
import { TeamService } from './services/TeamService';
import { MatchesService } from './services/MatchesService';
import { TeamRepository } from './repositories/TeamRepository';
import { MatchRepository } from './repositories/entities/MatchRepository';
import { TeamsController } from './controllers/TeamsController';
import { MatchesController } from './controllers/MatchesController';
import { TeamsRoute } from './routes/TeamsRoute';
import { MatchesRoute } from './routes/MatchesRoute';
import { Server } from './Server';

export const container = new Container();

// db
container.bind<Database>(Database).toSelf().inSingletonScope();

// server
container.bind<Server>(Server).toSelf().inSingletonScope();

// repositories
container.bind<TeamRepository>(TeamRepository).toSelf().inSingletonScope();
container.bind<MatchRepository>(MatchRepository).toSelf().inSingletonScope();

// services
container.bind<TeamService>(TeamService).toSelf().inSingletonScope();
container.bind<MatchesService>(MatchesService).toSelf().inSingletonScope();

// controllers
container.bind<TeamsController>(TeamsController).toSelf().inSingletonScope();
container.bind<MatchesController>(MatchesController).toSelf().inSingletonScope();

// routes
container.bind<TeamsRoute>(TeamsRoute).toSelf();
container.bind<MatchesRoute>(MatchesRoute).toSelf();
