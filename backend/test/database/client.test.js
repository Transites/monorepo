const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// Mock do módulo config/services
jest.mock('../../config/services', () => ({
  database: {
    url: process.env.TEST_DATABASE_URL || 'postgresql://localhost:5432/transitos_test',
    ssl: false,
    poolMin: 1,
    poolMax: 2
  }
}));

// Importar o cliente após o mock
const client = require('../../database/client');

describe('Database Client Tests', () => {
  beforeAll(async () => {
    // Limpar o banco de dados de teste
    const pool = new Pool({
      connectionString: process.env.TEST_DATABASE_URL || 'postgresql://localhost:5432/transitos_test',
    });

    await pool.query('DROP SCHEMA public CASCADE');
    await pool.query('CREATE SCHEMA public');

    // Carregar e executar o schema
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    await pool.query(schema);

    // Carregar e executar os índices
    const indexesPath = path.join(__dirname, '../../database/indexes.sql');
    const indexes = await fs.readFile(indexesPath, 'utf8');
    await pool.query(indexes);

    // Carregar e executar os triggers
    const triggersPath = path.join(__dirname, '../../database/triggers.sql');
    const triggers = await fs.readFile(triggersPath, 'utf8');
    await pool.query(triggers);

    await pool.end();
  });

  afterAll(async () => {
    await client.close();
  });

  test('Deve conectar ao banco de dados', async () => {
    const result = await client.query('SELECT 1 as test');
    expect(result.rows[0].test).toBe(1);
  });

  test('Deve executar health check', async () => {
    const health = await client.healthCheck();
    expect(health.status).toBe('healthy');
    expect(health.timestamp).toBeDefined();
  });

  test('Deve criar um admin', async () => {
    const admin = await client.create('admins', {
      email: 'test@example.com',
      password_hash: 'hash123',
      name: 'Test Admin'
    });

    expect(admin.id).toBeDefined();
    expect(admin.email).toBe('test@example.com');
    expect(admin.name).toBe('Test Admin');
    expect(admin.is_active).toBe(true);
    expect(admin.created_at).toBeDefined();
  });

  test('Deve encontrar um admin por ID', async () => {
    // Primeiro criar um admin
    const created = await client.create('admins', {
      email: 'find-by-id@example.com',
      password_hash: 'hash123',
      name: 'Find By ID'
    });

    // Depois buscar por ID
    const found = await client.findById('admins', created.id);

    expect(found.id).toBe(created.id);
    expect(found.email).toBe('find-by-id@example.com');
    expect(found.name).toBe('Find By ID');
  });

  test('Deve encontrar um admin por email', async () => {
    // Primeiro criar um admin
    const created = await client.create('admins', {
      email: 'find-by-email@example.com',
      password_hash: 'hash123',
      name: 'Find By Email'
    });

    // Depois buscar por email
    const found = await client.findByEmail('admins', 'find-by-email@example.com');

    expect(found.id).toBe(created.id);
    expect(found.email).toBe('find-by-email@example.com');
    expect(found.name).toBe('Find By Email');
  });

  test('Deve atualizar um admin', async () => {
    // Primeiro criar um admin
    const created = await client.create('admins', {
      email: 'update@example.com',
      password_hash: 'hash123',
      name: 'Before Update'
    });

    // Depois atualizar
    const updated = await client.update('admins', created.id, {
      name: 'After Update',
      is_active: false
    });

    expect(updated.id).toBe(created.id);
    expect(updated.email).toBe('update@example.com');
    expect(updated.name).toBe('After Update');
    expect(updated.is_active).toBe(false);
    expect(updated.updated_at).not.toBe(created.updated_at);
  });

  test('Deve excluir um admin', async () => {
    // Primeiro criar um admin
    const created = await client.create('admins', {
      email: 'delete@example.com',
      password_hash: 'hash123',
      name: 'To Delete'
    });

    // Depois excluir
    const deleted = await client.delete('admins', created.id);

    expect(deleted.id).toBe(created.id);

    // Verificar que não existe mais
    const found = await client.findById('admins', created.id);
    expect(found).toBeUndefined();
  });

  test('Deve criar uma submissão', async () => {
    const submission = await client.create('submissions', {
      token: 'a'.repeat(64),
      author_name: 'Test Author',
      author_email: 'author@example.com',
      title: 'Test Submission',
      content: 'This is a test submission content'
    });

    expect(submission.id).toBeDefined();
    expect(submission.token).toBe('a'.repeat(64));
    expect(submission.status).toBe('DRAFT');
    expect(submission.author_name).toBe('Test Author');
    expect(submission.title).toBe('Test Submission');
    expect(submission.created_at).toBeDefined();
    expect(submission.expires_at).toBeDefined();
  });

  test('Deve encontrar uma submissão por token', async () => {
    const token = 'b'.repeat(64);

    // Primeiro criar uma submissão
    const created = await client.create('submissions', {
      token: token,
      author_name: 'Token Author',
      author_email: 'token@example.com',
      title: 'Token Submission',
      content: 'This is a submission with a token'
    });

    // Depois buscar por token
    const found = await client.findByToken(token);

    expect(found.id).toBe(created.id);
    expect(found.token).toBe(token);
    expect(found.author_name).toBe('Token Author');
  });

  test('Deve executar uma transação com sucesso', async () => {
    const result = await client.transaction(async (txClient) => {
      // Criar um admin na transação
      const admin = await txClient.query(
        'INSERT INTO admins (email, password_hash, name) VALUES ($1, $2, $3) RETURNING *',
        ['transaction@example.com', 'hash123', 'Transaction Test']
      );

      // Criar uma submissão na mesma transação
      const submission = await txClient.query(
        'INSERT INTO submissions (token, author_name, author_email, title) VALUES ($1, $2, $3, $4) RETURNING *',
        ['c'.repeat(64), 'Transaction Author', 'transaction@example.com', 'Transaction Submission']
      );

      return {
        admin: admin.rows[0],
        submission: submission.rows[0]
      };
    });

    expect(result.admin.email).toBe('transaction@example.com');
    expect(result.submission.title).toBe('Transaction Submission');

    // Verificar que os dados foram persistidos
    const admin = await client.findByEmail('admins', 'transaction@example.com');
    expect(admin).toBeDefined();

    const submission = await client.findByToken('c'.repeat(64));
    expect(submission).toBeDefined();
  });

  test('Deve fazer rollback de uma transação com erro', async () => {
    const uniqueEmail = `rollback-${Date.now()}@example.com`;

    try {
      await client.transaction(async (txClient) => {
        // Criar um admin na transação
        await txClient.query(
          'INSERT INTO admins (email, password_hash, name) VALUES ($1, $2, $3) RETURNING *',
          [uniqueEmail, 'hash123', 'Rollback Test']
        );
        var longToken = 'a'.repeat(300); // String longa para forçar erro
        // Forçar um erro (violação de constraint)
        await txClient.query(
          'INSERT INTO submissions (token, author_name, author_email, title) VALUES ($1, $2, $3, $4) RETURNING *',
          [longToken, 'Long Token', 'Long@example.com', 'Long Token Test']
        );
      });

      // Se chegar aqui, o teste falhou
      expect(true).toBe(false);
    } catch (error) {
      // Esperamos um erro
      expect(error).toBeDefined();
    }

    // Verificar que o admin não foi persistido (rollback funcionou)
    const admin = await client.findByEmail('admins', uniqueEmail);
    expect(admin).toBeUndefined();
  });

});
