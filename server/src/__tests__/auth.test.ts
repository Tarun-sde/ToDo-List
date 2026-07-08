import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../index.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

const TEST_MONGO = process.env.MONGO_URI_TEST ?? 'mongodb://localhost:27017/taskflow_test';

beforeAll(async () => { await mongoose.connect(TEST_MONGO); });
afterAll(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); });
beforeEach(async () => { await User.deleteMany({}); });

describe('Auth', () => {
  it('registers a new user', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Test User', email: 'test@test.com', password: 'password123' });
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe('test@test.com');
  });

  it('rejects duplicate email on register', async () => {
    await User.create({ name: 'Existing', email: 'dup@test.com', passwordHash: await bcrypt.hash('password123', 12) });
    const res = await request(app).post('/api/auth/register').send({ name: 'New', email: 'dup@test.com', password: 'password123' });
    expect(res.status).toBe(409);
  });

  it('rejects short password on register', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'A', email: 'a@b.com', password: 'short' });
    expect(res.status).toBe(400);
  });

  it('logs in with correct credentials', async () => {
    const hash = await bcrypt.hash('password123', 12);
    await User.create({ name: 'Login User', email: 'login@test.com', passwordHash: hash });
    const res = await request(app).post('/api/auth/login').send({ email: 'login@test.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });

  it('rejects wrong password', async () => {
    const hash = await bcrypt.hash('password123', 12);
    await User.create({ name: 'User', email: 'user@test.com', passwordHash: hash });
    const res = await request(app).post('/api/auth/login').send({ email: 'user@test.com', password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });

  it('blocks unauthenticated /auth/me', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
