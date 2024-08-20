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
import { Scheduler } from './Scheduler';
import { FirstJob } from './jobs/FirstJob';
import { JobsRoute } from './routes/JobsRoute';
import { JobsController } from './controllers/JobsController';

export const container = new Container();

// application
container.bind<Application>(Application).toSelf();

// db
container.bind<Database>(Database).toSelf().inSingletonScope();

// server
container.bind<Server>(Server).toSelf().inSingletonScope();

// scheduler
container.bind<Scheduler>(Scheduler).toSelf().inSingletonScope();

// jobs
container.bind<FirstJob>(FirstJob).toSelf().inSingletonScope();

// repositories
container.bind<TeamRepository>(TeamRepository).toSelf().inSingletonScope();
container.bind<MatchRepository>(MatchRepository).toSelf().inSingletonScope();
container.bind<TaskRepository>(TaskRepository).toSelf().inSingletonScope();

// facades
container.bind<NuLigaFacade>(NuLigaFacade).toSelf().inSingletonScope();

// services
container.bind<TeamService>(TeamService).toSelf().inSingletonScope();
container.bind<MatchesService>(MatchesService).toSelf().inSingletonScope();
container.bind<TasksService>(TasksService).toSelf().inSingletonScope();

// controllers
container.bind<TeamsController>(TeamsController).toSelf().inSingletonScope();
container.bind<MatchesController>(MatchesController).toSelf().inSingletonScope();
container.bind<TasksController>(TasksController).toSelf().inSingletonScope();
container.bind<JobsController>(JobsController).toSelf().inSingletonScope();

// routes
container.bind<TeamsRoute>(TeamsRoute).toSelf();
container.bind<MatchesRoute>(MatchesRoute).toSelf();
container.bind<TasksRoute>(TasksRoute).toSelf();
container.bind<JobsRoute>(JobsRoute).toSelf();
