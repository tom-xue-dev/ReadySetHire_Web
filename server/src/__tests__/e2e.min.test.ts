import request from 'supertest';
import app from '../../src/index';

describe('Minimal E2E: auth -> jobs -> interviews -> applicants', () => {
  let token: string = '';

  it('health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  it('login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'recruiter1', password: 'admin123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    token = res.body.token;
  });

  it('list jobs', async () => {
    const res = await request(app)
      .get('/api/jobs')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('list interviews', async () => {
    const res = await request(app)
      .get('/api/interviews')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('list applicants', async () => {
    const res = await request(app)
      .get('/api/applicants')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});


