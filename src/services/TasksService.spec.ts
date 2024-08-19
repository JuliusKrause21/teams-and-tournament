import { anything, deepEqual, instance, mock, verify, when } from 'ts-mockito';
import { TaskRepository, TaskRepositoryError } from '../repositories/TaskRepository';
import { TasksService } from './TasksService';
import { Task, TaskType } from '../models/Task';
import { TaskEntity } from '../repositories/entities/TaskEntity';
import { ObjectId } from 'mongodb';
import { MatchesService } from './MatchesService';
import { Match } from '../models/Match';

describe('TasksService', () => {
  let taskRepository: TaskRepository;
  let tasksService: TasksService;
  let matchService: MatchesService;

  const dueDateOne = new Date('01.01.2020').toISOString();
  const dueDateTwo = new Date('02.02.2025').toISOString();
  const dueDates = [dueDateOne, dueDateTwo];
  const taskEntities = dueDates.map(
    (dueDate) => new TaskEntity({ type: TaskType.Simple, description: 'Something to do', due_date: dueDate })
  );

  const expectedTaskOne: Task = {
    type: TaskType.Simple,
    description: 'Something to do',
    dueDate: dueDateOne,
    assignedPlayers: [],
    numberOfNeeds: 1,
  };

  const expectedTaskTwo: Task = {
    type: TaskType.Simple,
    description: 'Something to do',
    dueDate: dueDateTwo,
    assignedPlayers: [],
    numberOfNeeds: 1,
  };

  beforeEach(() => {
    taskRepository = mock(TaskRepository);
    matchService = mock(MatchesService);
    tasksService = new TasksService(instance(taskRepository), instance(matchService));
  });

  describe('listTasks', () => {
    test('to list all tasks', async () => {
      when(taskRepository.findAll(undefined)).thenResolve(taskEntities);

      const result = await tasksService.listTasks();
      expect(result).toStrictEqual({ statusCode: 200, body: [expectedTaskOne, expectedTaskTwo] });
    });

    test('to list all tasks with due date as query parameter', async () => {
      when(taskRepository.findAll(deepEqual({ due_date: dueDateOne }))).thenResolve([taskEntities[0]]);

      const result = await tasksService.listTasks({ dueDate: dueDateOne });
      expect(result).toStrictEqual({ statusCode: 200, body: [expectedTaskOne] });
    });

    test('to return empty array if query parameter does not match', async () => {
      when(taskRepository.findAll(deepEqual({ due_date: 'something-else' }))).thenResolve([]);

      const result = await tasksService.listTasks({ dueDate: 'something-else' });
      expect(result).toStrictEqual({ statusCode: 200, body: [] });
    });
  });

  describe('getTask', () => {
    const mockedUuid = 'c7e8f262-e26f-4176-b0b3-56562ad2b090';

    test('to get task by id', async () => {
      when(taskRepository.findByTaskId(mockedUuid)).thenResolve(taskEntities[0]);
      const result = await tasksService.getTask(mockedUuid);
      expect(result.statusCode).toBe(200);
      expect(result.body).toStrictEqual(expectedTaskOne);
    });

    test('to return 404 if not task with task id found', async () => {
      when(taskRepository.findByTaskId(mockedUuid)).thenResolve(null);
      const result = await tasksService.getTask(mockedUuid);
      expect(result.statusCode).toBe(404);
    });
  });

  describe('createTask', () => {
    const task: Task = {
      type: TaskType.Simple,
      description: 'Something to do',
      dueDate: dueDateOne,
      assignedPlayers: [],
      numberOfNeeds: 2,
    };

    test('to create a task', async () => {
      when(taskRepository.insert(anything())).thenResolve({
        acknowledged: true,
        insertedId: new ObjectId(),
      });

      const result = await tasksService.createTask(task);
      expect(result.statusCode).toBe(201);
    });

    test('failed to acknowledge task creation', async () => {
      when(taskRepository.insert(anything())).thenResolve({
        acknowledged: false,
        insertedId: new ObjectId(),
      });

      const result = await tasksService.createTask(task);
      expect(result.statusCode).toBe(500);
    });
  });

  describe('updateTask', () => {
    const mockedUuid = 'c7e8f262-e26f-4176-b0b3-56562ad2b090';
    const assignedPlayers = ['Julius'];
    const task: Task = {
      type: TaskType.Simple,
      description: 'Something to do',
      dueDate: dueDateOne,
      assignedPlayers: [],
      numberOfNeeds: 2,
    };
    test('to update task', async () => {
      const updatedEntity: TaskEntity = {
        type: TaskType.Simple,
        description: 'Something to do',
        due_date: dueDateOne,
        assigned: assignedPlayers,
        number_of_needs: 2,
        resolved: false,
      };
      when(taskRepository.updateOne(mockedUuid, deepEqual(updatedEntity))).thenResolve();
      const result = await tasksService.updateTask(mockedUuid, { ...task, assignedPlayers });
      expect(result.statusCode).toBe(200);
    });

    test('to throw error if task id not found', async () => {
      const nonExistingId = 'non-existing-id';
      when(taskRepository.updateOne(nonExistingId, anything())).thenThrow(
        new Error(TaskRepositoryError.FindMatchFailed)
      );
      expect(async () => await tasksService.updateTask(nonExistingId, { ...task, assignedPlayers })).rejects.toThrow(
        TaskRepositoryError.FindMatchFailed
      );
    });

    test('to throw error if update acknowledgement fails', async () => {
      when(taskRepository.updateOne(mockedUuid, anything())).thenThrow(
        new Error(TaskRepositoryError.UpdateAcknowledgeFailed)
      );
      expect(async () => await tasksService.updateTask(mockedUuid, { ...task, assignedPlayers })).rejects.toThrow(
        TaskRepositoryError.UpdateAcknowledgeFailed
      );
    });
  });

  describe('assignRandomly', () => {
    beforeEach(() => {
      jest.spyOn(global.Math, 'random').mockReturnValue(0.54321);
    });

    afterEach(() => {
      jest.spyOn(global.Math, 'random').mockRestore();
    });
    const mockedUuid = 'c7e8f262-e26f-4176-b0b3-56562ad2b090';

    const match: Match = {
      availablePlayers: ['Player1', 'Player2', 'Player3'],
      date: 'some date',
      day: 'some day',
      location: 'some location',
      awayTeam: 'Away',
      homeTeam: 'Home',
    };

    const taskEntity: TaskEntity = {
      type: TaskType.Simple,
      description: 'Something to do',
      assigned: [],
      number_of_needs: 1,
      task_id: mockedUuid,
      due_date: match.date,
      resolved: false,
    };

    test('to return 200 if no matches available on filtered date', async () => {
      when(taskRepository.findByTaskId(mockedUuid)).thenResolve(taskEntity);
      when(matchService.listMatches(deepEqual({ date: match.date }))).thenResolve([]);

      const result = await tasksService.assignRandomly(mockedUuid);
      expect(result.statusCode).toBe(200);
      verify(taskRepository.updateOne(anything(), anything())).never();
    });

    test('to return 500 if no more than on match available on filtered date', async () => {
      when(taskRepository.findByTaskId(mockedUuid)).thenResolve(taskEntity);
      when(matchService.listMatches(deepEqual({ date: match.date }))).thenResolve([match, match]);

      const result = await tasksService.assignRandomly(mockedUuid);
      expect(result.statusCode).toBe(500);
      verify(taskRepository.updateOne(anything(), anything())).never();
    });

    test('to return 500 if there are no more players available to assign', async () => {
      const taskEntityForFourNeeds: TaskEntity = {
        ...taskEntity,
        assigned: match.availablePlayers,
        number_of_needs: 4,
      };
      when(taskRepository.findByTaskId(mockedUuid)).thenResolve(taskEntityForFourNeeds);
      when(matchService.listMatches(deepEqual({ date: match.date }))).thenResolve([match]);

      const result = await tasksService.assignRandomly(mockedUuid);
      expect(result.statusCode).toBe(500);
      verify(taskRepository.updateOne(anything(), anything())).never();
    });

    test('to return 404 if task could not be found', async () => {
      when(taskRepository.findByTaskId(mockedUuid)).thenResolve(null);

      const result = await tasksService.assignRandomly(mockedUuid);
      expect(result.statusCode).toBe(404);
      verify(taskRepository.updateOne(anything(), anything())).never();
    });

    test('to update task entity for one required assignee if nobody is assigned yet', async () => {
      const updatedTaskEntity: TaskEntity = {
        ...taskEntity,
        assigned: [match.availablePlayers[1]],
        resolved: true,
      };
      when(taskRepository.findByTaskId(mockedUuid)).thenResolve(taskEntity);
      when(matchService.listMatches(deepEqual({ date: match.date }))).thenResolve([match]);
      when(taskRepository.updateOne(mockedUuid, deepEqual(updatedTaskEntity))).thenResolve();

      const result = await tasksService.assignRandomly(mockedUuid);
      expect(result.statusCode).toBe(200);
    });

    test('to update task entity for two required assignees if nobody is assigned yet', async () => {
      const taskEntityForTwoNeeds: TaskEntity = {
        ...taskEntity,
        number_of_needs: 2,
      };
      const updatedTaskEntity: TaskEntity = {
        ...taskEntityForTwoNeeds,
        assigned: [match.availablePlayers[1], match.availablePlayers[2]],
        resolved: true,
      };
      when(taskRepository.findByTaskId(mockedUuid)).thenResolve(taskEntityForTwoNeeds);
      when(matchService.listMatches(deepEqual({ date: match.date }))).thenResolve([match]);
      when(taskRepository.updateOne(mockedUuid, deepEqual(updatedTaskEntity))).thenResolve();

      const result = await tasksService.assignRandomly(mockedUuid);
      expect(result.statusCode).toBe(200);
    });

    test('to update task entity for two required assignees if one is already assigned', async () => {
      const taskEntityForOneAssignee: TaskEntity = {
        ...taskEntity,
        assigned: [match.availablePlayers[1]],
        number_of_needs: 2,
      };
      const updatedTaskEntity: TaskEntity = {
        ...taskEntityForOneAssignee,
        assigned: [match.availablePlayers[1], match.availablePlayers[2]],
        resolved: true,
      };
      when(taskRepository.findByTaskId(mockedUuid)).thenResolve(taskEntityForOneAssignee);
      when(matchService.listMatches(deepEqual({ date: match.date }))).thenResolve([match]);
      when(taskRepository.updateOne(mockedUuid, deepEqual(updatedTaskEntity))).thenResolve();

      const result = await tasksService.assignRandomly(mockedUuid);
      expect(result.statusCode).toBe(200);
    });

    test('to update task entity for two required assignees if both is already assigned', async () => {
      const taskEntityForThreeNeeds: TaskEntity = {
        ...taskEntity,
        assigned: match.availablePlayers,
        number_of_needs: 3,
      };
      when(taskRepository.findByTaskId(mockedUuid)).thenResolve(taskEntityForThreeNeeds);
      when(matchService.listMatches(deepEqual({ date: match.date }))).thenResolve([match]);

      const result = await tasksService.assignRandomly(mockedUuid);
      expect(result.statusCode).toBe(200);
      verify(taskRepository.updateOne(anything(), anything())).never();
    });
  });
});
