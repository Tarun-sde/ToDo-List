import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { app } from '../index.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import bcrypt from 'bcryptjs';

const TEST_MONGO = process.env.MONGO_URI_TEST ?? 'mongodb://localhost:27017/taskflow_test';

let token: string;
let userId: string;

beforeAll(async () => {
  await mongoose.connect(TEST_MONGO);
  const hash = await bcrypt.hash('password123', 12);
  const user = await User.create({ name: 'Proj User', email: 'proj@test.com', passwordHash: hash });
  userId = user.id;
  token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_ACCESS_SECRET ?? 'testsecret', { expiresIn: '1h' });
});

afterAll(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); });
beforeEach(async () => { await Project.deleteMany({}); await Task.deleteMany({}); });

describe('Projects', () => {
  it('creates a project', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'My Project', color: '#6366f1' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('My Project');
  });

  it('lists projects', async () => {
    await Project.create({ name: 'P1', owner: userId, color: '#fff' });
    const res = await request(app).get('/api/projects').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('updates a project', async () => {
    const proj = await Project.create({ name: 'Old', owner: userId, color: '#111111' });
    const res = await request(app)
      .put(`/api/projects/${proj.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Name' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('New Name');
  });

  it('deletes project and orphans tasks', async () => {
    const proj = await Project.create({ name: 'Del', owner: userId, color: '#222222' });
    const task = await Task.create({ title: 'Orphan me', owner: userId, project: proj.id, status: 'todo', priority: 'low', tags: [] });
    const res = await request(app).delete(`/api/projects/${proj.id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const updated = await Task.findById(task.id);
    expect(updated?.project).toBeNull();
  });

  it('rejects invalid color', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Bad', color: 'not-a-color' });
    expect(res.status).toBe(400);
  });
});
