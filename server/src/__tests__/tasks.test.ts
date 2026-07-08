import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { app } from '../index.js';
import User from '../models/User.js';
import Task from '../models/Task.js';
import bcrypt from 'bcryptjs';

const TEST_MONGO = process.env.MONGO_URI_TEST ?? 'mongodb://localhost:27017/taskflow_test';

let token: string;
let userId: string;

beforeAll(async () => {
  await mongoose.connect(TEST_MONGO);
  const hash = await bcrypt.hash('password123', 12);
  const user = await User.create({ name: 'Task User', email: 'tasks@test.com', passwordHash: hash });
  userId = user.id;
  token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_ACCESS_SECRET ?? 'testsecret', { expiresIn: '1h' });
});

afterAll(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); });
beforeEach(async () => { await Task.deleteMany({}); });

describe('Tasks CRUD', () => {
  it('creates a task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test task', priority: 'high' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Test task');
    expect(res.body.priority).toBe('high');
  });

  it('lists tasks', async () => {
    await Task.create({ title: 'A', owner: userId, status: 'todo', priority: 'low', tags: [] });
    const res = await request(app).get('/api/tasks').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.tasks.length).toBeGreaterThan(0);
  });

  it('filters tasks by status', async () => {
    await Task.create({ title: 'Done task', owner: userId, status: 'done', priority: 'low', tags: [] });
    await Task.create({ title: 'Todo task', owner: userId, status: 'todo', priority: 'low', tags: [] });
    const res = await request(app).get('/api/tasks?status=done').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.tasks.every((t: { status: string }) => t.status === 'done')).toBe(true);
  });

  it('updates a task', async () => {
    const task = await Task.create({ title: 'Old', owner: userId, status: 'todo', priority: 'low', tags: [] });
    const res = await request(app)
      .put(`/api/tasks/${task.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated', status: 'in-progress', priority: 'medium' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated');
  });

  it('patches task status', async () => {
    const task = await Task.create({ title: 'Patch me', owner: userId, status: 'todo', priority: 'low', tags: [] });
    const res = await request(app)
      .patch(`/api/tasks/${task.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'done' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('done');
    expect(res.body.completedAt).toBeTruthy();
  });

  it('deletes a task', async () => {
    const task = await Task.create({ title: 'Delete me', owner: userId, status: 'todo', priority: 'low', tags: [] });
    const res = await request(app)
      .delete(`/api/tasks/${task.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(await Task.findById(task.id)).toBeNull();
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(401);
  });

  it('returns 404 for another user task', async () => {
    const other = await User.create({ name: 'Other', email: 'other@test.com', passwordHash: 'x' });
    const task = await Task.create({ title: 'Not yours', owner: other.id, status: 'todo', priority: 'low', tags: [] });
    const res = await request(app).get(`/api/tasks/${task.id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
