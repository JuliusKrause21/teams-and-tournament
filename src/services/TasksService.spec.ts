import { anything, deepEqual, instance, mock, when } from 'ts-mockito';
import { TaskRepository } from '../repositories/TaskRepository';
import { TasksService } from './TasksService';
import { Task, TaskType } from '../models/Task';
import { TaskEntity } from '../repositories/entities/TaskEntity';
import { ObjectId } from 'mongodb';

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

  describe('createTask', () => {
    const task: Task = {
      type: TaskType.Simple,
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
      dueDate: dueDateOne,
      assignedPlayers: [],
      numberOfNeeds: 2,
    };
    test('to update task', async () => {
      const updatedEntity: TaskEntity = {
        type: TaskType.Simple,
        due_date: dueDateOne,
        assigned: assignedPlayers,
        number_of_needs: 2,
      };
      when(taskRepository.updateOne(mockedUuid, deepEqual(updatedEntity))).thenResolve({
        acknowledged: true,
        matchedCount: 1,
        modifiedCount: 1,
        upsertedId: null,
        upsertedCount: 0,
      });
      const result = await tasksService.updateTask(mockedUuid, { ...task, assignedPlayers });
      expect(result.statusCode).toBe(200);
    });

    test('to return 404 if task id not found', async () => {
      const nonExistingId = 'non-existing-id';
      when(taskRepository.updateOne(nonExistingId, anything())).thenResolve({
        acknowledged: true,
        matchedCount: 0,
        modifiedCount: 0,
        upsertedId: null,
        upsertedCount: 0,
      });
      const result = await tasksService.updateTask(nonExistingId, { ...task, assignedPlayers });
      expect(result.statusCode).toBe(404);
    });

    test('to return 500 if update acknowledgement fails', async () => {
      when(taskRepository.updateOne(mockedUuid, anything())).thenResolve({
        acknowledged: false,
        matchedCount: 0,
        modifiedCount: 0,
        upsertedId: null,
        upsertedCount: 0,
      });
      const result = await tasksService.updateTask(mockedUuid, { ...task, assignedPlayers });
      expect(result.statusCode).toBe(500);
    });
  });
});
