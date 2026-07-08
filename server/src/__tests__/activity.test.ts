import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../index.js';
import User from '../models/User.js';
import Activity from '../models/Activity.js';
import jwt from 'jsonwebtoken';

describe('Activity API', () => {
  let token: string;
  let userId: string;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/taskflow_test');
    
    const user = await User.create({
      name: 'Activity Tester',
      email: 'activity@example.com',
      passwordHash: 'hashed',
    });
    userId = user.id;
    token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_ACCESS_SECRET || 'secret', { expiresIn: '1h' });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Activity.deleteMany({});
    await mongoose.connection.close();
  });

  it('should return empty activity list initially', async () => {
    const res = await request(app)
      .get('/api/activity')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    expect(res.body.activities).toEqual([]);
  });

  it('should fetch activities sorted by newest', async () => {
    await Activity.create({ user: userId, type: 'TASK_CREATED', message: 'Task 1' });
    await Activity.create({ user: userId, type: 'TASK_COMPLETED', message: 'Task 2' });

    const res = await request(app)
      .get('/api/activity?limit=1')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    expect(res.body.activities).toHaveLength(1);
    expect(res.body.activities[0].type).toBe('TASK_COMPLETED');
  });
});
