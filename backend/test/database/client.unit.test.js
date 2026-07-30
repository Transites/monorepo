jest.resetModules();

const clientMock = {
  query: jest.fn(),
  release: jest.fn()
};

jest.mock('pg', () => {
  const pool = {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
    on: jest.fn()
  };
  global.__PG_POOL_MOCK = pool;
  return {
    Pool: jest.fn(() => pool)
  };
});

const db = require('../../database/client');

describe('DatabaseClient (unit, mocked Pool)', () => {
  let pool;
  beforeEach(() => {
    jest.clearAllMocks();
    pool = global.__PG_POOL_MOCK;
    pool.connect.mockResolvedValue(clientMock);
  });

  it('query forwards to pool.query and returns result', async () => {
    pool.query.mockResolvedValue({ rowCount: 1, rows: [{ id: 'x' }] });
    const res = await db.query('SELECT 1');
    expect(pool.query).toHaveBeenCalledWith('SELECT 1', undefined);
    expect(res.rows[0].id).toBe('x');
  });

  it('transaction commits on success and releases client', async () => {
    pool.connect.mockResolvedValue(clientMock);
    clientMock.query.mockResolvedValueOnce(); // BEGIN
    clientMock.query.mockResolvedValueOnce({ rows: [{ ok: true }] }); // callback
    clientMock.query.mockResolvedValueOnce(); // COMMIT

    const result = await db.transaction(async (client) => {
      await client.query('SELECT 1');
      return { ok: true };
    });

    expect(clientMock.query).toHaveBeenCalled();
    expect(clientMock.release).toHaveBeenCalled();
    expect(result).toEqual({ ok: true });
  });

  it('findById returns first row', async () => {
    pool.query.mockResolvedValue({ rows: [{ id: 'r1' }] });
    const row = await db.findById('table', 'id1');
    expect(row.id).toBe('r1');
  });

  it('create builds insert and returns row', async () => {
    pool.query.mockResolvedValue({ rows: [{ id: 'new' }] });
    const row = await db.create('t', { a: 1, b: 'x' });
    expect(row.id).toBe('new');
  });

  it('update builds update and returns row', async () => {
    pool.query.mockResolvedValue({ rows: [{ id: 'u1' }] });
    const row = await db.update('t', 'id1', { a: 2 });
    expect(row.id).toBe('u1');
  });

  it('delete removes and returns row', async () => {
    pool.query.mockResolvedValue({ rows: [{ id: 'd1' }] });
    const row = await db.delete('t', 'id1');
    expect(row.id).toBe('d1');
  });

  it('healthCheck returns healthy on success', async () => {
    pool.query.mockResolvedValue({ rowCount: 1 });
    const h = await db.healthCheck();
    expect(h.status).toBe('healthy');
  });

  it('cleanupExpiredTokens returns rows', async () => {
    pool.query.mockResolvedValue({ rows: [{ id: 'e1' }] });
    const rows = await db.cleanupExpiredTokens();
    expect(Array.isArray(rows)).toBe(true);
  });

  it('close calls pool.end', async () => {
    await db.close();
    expect(pool.end).toHaveBeenCalled();
  });
});
