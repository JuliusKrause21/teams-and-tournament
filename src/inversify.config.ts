import 'reflect-metadata';
import { Container } from 'inversify';
import { Database } from './Database';
import { TeamService } from './services/TeamService';
import { MatchesService } from './services/MatchesService';
import { TeamRepository } from './repositories/TeamRepository';
import { MatchRepository } from './repositories/MatchRepository';
import { TeamsController } from './controllers/TeamsController';
import { MatchesController } from './controllers/MatchesController';
import { TeamsRoute } from './routes/TeamsRoute';
import { MatchesRoute } from './routes/MatchesRoute';
import { Server } from './Server';
import { Application } from './Application';
import { TaskRepository } from './repositories/TaskRepository';
import { TasksService } from './services/TasksService';
import { TasksController } from './controllers/TasksController';
import { TasksRoute } from './routes/TasksRoute';
import { NuLigaFacade } from './facades/NuLigaFacade';
import { MatchDistributionService } from './services/MatchDistributionService';
import { MatchValidationService } from './services/MatchValidationService';
import { GameService } from './services/GameService';
import { GameRepository } from './repositories/GameRepository';
import { GameController } from './controllers/GameConstroller';
import { GameRoute } from './routes/GameRoute';

export const container = new Container();

// application
container.bind<Application>(Application).toSelf();

// db
container.bind<Database>(Database).toSelf().inSingletonScope();

// server
container.bind<Server>(Server).toSelf().inSingletonScope();

// repositories
container.bind<TeamRepository>(TeamRepository).toSelf().inSingletonScope();
container.bind<MatchRepository>(MatchRepository).toSelf().inSingletonScope();
container.bind<TaskRepository>(TaskRepository).toSelf().inSingletonScope();
container.bind<GameRepository>(GameRepository).toSelf().inSingletonScope();

// facades
container.bind<NuLigaFacade>(NuLigaFacade).toSelf().inSingletonScope();

// services
container.bind<TeamService>(TeamService).toSelf().inSingletonScope();
container.bind<MatchesService>(MatchesService).toSelf().inSingletonScope();
container.bind<TasksService>(TasksService).toSelf().inSingletonScope();
container.bind<MatchDistributionService>(MatchDistributionService).toSelf().inSingletonScope();
container.bind<MatchValidationService>(MatchValidationService).toSelf().inSingletonScope();
container.bind<GameService>(GameService).toSelf().inSingletonScope();

// controllers
container.bind<TeamsController>(TeamsController).toSelf().inSingletonScope();
container.bind<MatchesController>(MatchesController).toSelf().inSingletonScope();
container.bind<TasksController>(TasksController).toSelf().inSingletonScope();
container.bind<GameController>(GameController).toSelf().inSingletonScope();

// routes
container.bind<TeamsRoute>(TeamsRoute).toSelf();
container.bind<MatchesRoute>(MatchesRoute).toSelf();
container.bind<TasksRoute>(TasksRoute).toSelf();
container.bind<GameRoute>(GameRoute).toSelf();
