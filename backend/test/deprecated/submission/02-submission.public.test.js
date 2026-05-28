// Mock submission service BEFORE requiring app so controllers see the mock
jest.mock('../services/submission');

const request = require('supertest');
const submissionService = require('../services/submission');
const app = require('../app');

describe('Submission public endpoints', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('GET /submissions should return list via submissionService.listSubmissions', async () => {
    submissionService.listSubmissions.mockResolvedValueOnce({ success: true, data: [] });

    const res = await request(app).get('/submissions');

    expect(res.status).toBe(200);
    expect(submissionService.listSubmissions).toHaveBeenCalled();
    expect(res.body).toHaveProperty('success', true);
  });

  test('GET /submissions/:id returns 400 for invalid UUID', async () => {
    const res = await request(app).get('/submissions/not-a-uuid');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
  });

  test('GET /submissions/search?q=term calls searchSubmissionsFuzzy', async () => {
    submissionService.searchSubmissionsFuzzy = jest.fn().mockResolvedValueOnce({ success: true, data: [] });

    const res = await request(app).get('/submissions/search').query({ q: 'term' });

    expect(res.status).toBe(200);
    expect(submissionService.searchSubmissionsFuzzy).toHaveBeenCalledWith('term');
    expect(res.body).toHaveProperty('success', true);
  });
});
