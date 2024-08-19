import { anything, deepEqual, instance, mock, objectContaining, verify, when } from 'ts-mockito';
import { TaskRepository, TaskRepositoryError } from '../repositories/TaskRepository';
import { TasksService, TasksServiceError } from './TasksService';
import { Task, TaskType } from '../models/Task';
import { TaskEntity } from '../repositories/entities/TaskEntity';
import { MatchesService } from './MatchesService';
import { Match } from '../models/Match';

const mockUUid = jest.fn();
jest.mock('uuid', () => {
  return {
    v4: () => mockUUid(),
  };
});

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
      expect(result).toStrictEqual([expectedTaskOne, expectedTaskTwo]);
    });

    test('to list all tasks with due date as query parameter', async () => {
      when(taskRepository.findAll(deepEqual({ due_date: dueDateOne }))).thenResolve([taskEntities[0]]);

      const result = await tasksService.listTasks({ dueDate: dueDateOne });
      expect(result).toStrictEqual([expectedTaskOne]);
    });

    test('to return empty array if query parameter does not match', async () => {
      when(taskRepository.findAll(deepEqual({ due_date: 'something-else' }))).thenResolve([]);

      const result = await tasksService.listTasks({ dueDate: 'something-else' });
      expect(result).toStrictEqual([]);
    });
  });

  describe('getTask', () => {
    const mockedUuid = 'c7e8f262-e26f-4176-b0b3-56562ad2b090';

    test('to get task by id', async () => {
      when(taskRepository.findById(mockedUuid)).thenResolve(taskEntities[0]);
      const result = await tasksService.getTask(mockedUuid);
      expect(result).toStrictEqual(expectedTaskOne);
    });

    test('to throw an error if not task with task id found', async () => {
      when(taskRepository.findById(mockedUuid)).thenThrow(new Error(TaskRepositoryError.FindTaskFailed));
      expect(async () => await tasksService.getTask(mockedUuid)).rejects.toThrow(TaskRepositoryError.FindTaskFailed);
    });
  });

  describe('createTask', () => {
    const mockedTaskId = 'a6ca1315-f454-4939-909f-17e6a8318e1e';
    const mockedLastModified = '2000-01-01T00:00:00.000Z';
    const task: Task = {
      type: TaskType.Simple,
      description: 'Something to do',
      dueDate: dueDateOne,
      assignedPlayers: [],
      numberOfNeeds: 2,
    };

    beforeEach(() => {
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(mockedLastModified);
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    test('to create a task', async () => {
      const mockedTaskEntity: TaskEntity = {
        type: task.type,
        description: task.description,
        due_date: task.dueDate,
        assigned: task.assignedPlayers,
        number_of_needs: task.numberOfNeeds,
        last_modified: mockedLastModified,
        task_id: mockedTaskId,
        resolved: false,
      };
      mockUUid.mockReturnValue(mockedTaskId);
      when(taskRepository.insert(objectContaining(mockedTaskEntity))).thenResolve(mockedTaskEntity);

      const result = await tasksService.createTask(task);
      expect(result).toStrictEqual({ ...task, location: `/tasks/${mockedTaskId}` });
    });

    test('failed to acknowledge task creation', async () => {
      when(taskRepository.insert(anything())).thenThrow(new Error(TaskRepositoryError.InsertAcknowledgeFailed));

      expect(async () => await tasksService.createTask(task)).rejects.toThrow(
        TaskRepositoryError.InsertAcknowledgeFailed
      );
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
      const expectedTask = { ...task, assignedPlayers };
      when(taskRepository.updateOne(mockedUuid, deepEqual(updatedEntity))).thenResolve();
      const result = await tasksService.updateTask(mockedUuid, { ...task, assignedPlayers });
      expect(result).toStrictEqual(expectedTask);
    });

    test('to throw error if task id not found', async () => {
      const nonExistingId = 'non-existing-id';
      when(taskRepository.updateOne(nonExistingId, anything())).thenThrow(
        new Error(TaskRepositoryError.FindTaskFailed)
      );
      expect(async () => await tasksService.updateTask(nonExistingId, { ...task, assignedPlayers })).rejects.toThrow(
        TaskRepositoryError.FindTaskFailed
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
      jest.clearAllMocks();
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

    const task: Task = {
      type: taskEntity.type,
      description: taskEntity.description,
      assignedPlayers: taskEntity.assigned,
      numberOfNeeds: taskEntity.number_of_needs,
      dueDate: taskEntity.due_date,
    };

    test('to update task entity for one required assignee if nobody is assigned yet', async () => {
      const updatedTaskEntity: TaskEntity = {
        ...taskEntity,
        assigned: [match.availablePlayers[1]],
        resolved: true,
      };
      when(taskRepository.findById(mockedUuid)).thenResolve({ ...taskEntity });
      when(matchService.listMatches(deepEqual({ date: match.date }))).thenResolve([match]);
      when(taskRepository.updateOne(mockedUuid, deepEqual(updatedTaskEntity))).thenResolve();

      const result = await tasksService.assignRandomly(mockedUuid);
      expect(result).toStrictEqual(task);
    });

    test('to update task entity for two required assignees if nobody is assigned yet', async () => {
      const taskEntityForTwoNeeds: TaskEntity = {
        ...taskEntity,
        number_of_needs: 2,
      };
      const updatedTaskEntityForTwoNeeds: TaskEntity = {
        ...taskEntityForTwoNeeds,
        assigned: [match.availablePlayers[1], match.availablePlayers[2]],
        resolved: true,
      };
      const expectedTask: Task = {
        ...task,
        numberOfNeeds: 2,
        assignedPlayers: [match.availablePlayers[1], match.availablePlayers[2]],
      };
      when(taskRepository.findById(mockedUuid)).thenResolve(taskEntityForTwoNeeds);
      when(matchService.listMatches(deepEqual({ date: match.date }))).thenResolve([match]);
      when(taskRepository.updateOne(mockedUuid, deepEqual(updatedTaskEntityForTwoNeeds))).thenResolve();

      const result = await tasksService.assignRandomly(mockedUuid);
      expect(result).toStrictEqual(expectedTask);
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
      const expectedTask: Task = {
        ...task,
        numberOfNeeds: 2,
        assignedPlayers: [match.availablePlayers[1], match.availablePlayers[2]],
      };
      when(taskRepository.findById(mockedUuid)).thenResolve(taskEntityForOneAssignee);
      when(matchService.listMatches(deepEqual({ date: match.date }))).thenResolve([match]);
      when(taskRepository.updateOne(mockedUuid, deepEqual(updatedTaskEntity))).thenResolve();

      const result = await tasksService.assignRandomly(mockedUuid);
      expect(result).toStrictEqual(expectedTask);
    });

    test('to throw an error if no players left to assign is already assigned', async () => {
      const taskEntityForThreeNeeds: TaskEntity = {
        ...taskEntity,
        assigned: match.availablePlayers,
        number_of_needs: 3,
      };
      when(taskRepository.findById(mockedUuid)).thenResolve(taskEntityForThreeNeeds);
      when(matchService.listMatches(deepEqual({ date: match.date }))).thenResolve([match]);

      expect(async () => await tasksService.assignRandomly(mockedUuid)).rejects.toThrow(
        TasksServiceError.NoPlayersAssignable
      );
      verify(taskRepository.updateOne(anything(), anything())).never();
    });

    test('to throw an error if no matches available on filtered date', async () => {
      when(taskRepository.findById(mockedUuid)).thenResolve(taskEntity);
      when(matchService.listMatches(deepEqual({ date: match.date }))).thenResolve([]);

      expect(async () => await tasksService.assignRandomly(mockedUuid)).rejects.toThrow(TasksServiceError.NoMatch);
      verify(taskRepository.updateOne(anything(), anything())).never();
    });

    test('to throw an error if no more than on match available on filtered date', async () => {
      when(taskRepository.findById(mockedUuid)).thenResolve(taskEntity);
      when(matchService.listMatches(deepEqual({ date: match.date }))).thenResolve([match, match]);

      expect(async () => await tasksService.assignRandomly(mockedUuid)).rejects.toThrow(
        TasksServiceError.MoreThanOneMatch
      );
      verify(taskRepository.updateOne(anything(), anything())).never();
    });

    test('to throw an error if there are no more players available to assign', async () => {
      const taskEntityForFourNeeds: TaskEntity = {
        ...taskEntity,
        assigned: match.availablePlayers,
        number_of_needs: 4,
      };
      when(taskRepository.findById(mockedUuid)).thenResolve(taskEntityForFourNeeds);
      when(matchService.listMatches(deepEqual({ date: match.date }))).thenResolve([match]);

      expect(async () => await tasksService.assignRandomly(mockedUuid)).rejects.toThrow(
        TasksServiceError.NoPlayersAssignable
      );
      verify(taskRepository.updateOne(anything(), anything())).never();
    });

    test('to throw an error if task could not be found', async () => {
      when(taskRepository.findById(mockedUuid)).thenThrow(new Error(TaskRepositoryError.FindTaskFailed));

      expect(async () => await tasksService.assignRandomly(mockedUuid)).rejects.toThrow(
        TaskRepositoryError.FindTaskFailed
      );
      verify(taskRepository.updateOne(anything(), anything())).never();
    });
  });
});
