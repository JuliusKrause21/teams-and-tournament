import { deepEqual, instance, mock, when } from 'ts-mockito';
import { TaskRepository } from '../repositories/TaskRepository';
import { TasksService } from './TasksService';
import { TaskType } from '../models/Task';
import { TaskEntity } from '../repositories/entities/TaskEntity';

describe('TasksService', () => {
  let taskRepository: TaskRepository;
  let tasksService: TasksService;

  const dueDateOne = new Date('01.01.2020').toISOString();
  const dueDateTwo = new Date('02.02.2025').toISOString();
  const dueDates = [dueDateOne, dueDateTwo];
  const taskEntities = dueDates.map((dueDate) => new TaskEntity({ type: TaskType.Simple, due_date: dueDate }));

  const expectedTaskOne = {
    type: TaskType.Simple,
    dueDate: dueDateOne,
    assignedPlayers: [],
    numberOfNeeds: 1,
  };

  const expectedTaskTwo = {
    type: TaskType.Simple,
    dueDate: dueDateTwo,
    assignedPlayers: [],
    numberOfNeeds: 1,
  };

  beforeEach(() => {
    taskRepository = mock(TaskRepository);
    tasksService = new TasksService(instance(taskRepository));
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
});
