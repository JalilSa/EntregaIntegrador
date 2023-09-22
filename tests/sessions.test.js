import { expect } from 'chai';
import request from 'supertest';
import { app } from '../app.js';

describe('Sessions Router', () => {
  it('should register a user', async () => {
    const res = await request(app).post('/register').send({ email: 'test@example.com', password: 'password123' });
    expect(res.statusCode).to.equal(200);

  });

  it('should login a user', async () => {
    const res = await request(app).post('/login').send({ email: 'test@example.com', password: 'password123' });
    expect(res.statusCode).to.equal(200);

  });

  it('should logout a user', async () => {
    await request(app).post('/login').send({ email: 'test@example.com', password: 'password123' });
    const res = await request(app).get('/logout');
    expect(res.statusCode).to.equal(200);

  });
});