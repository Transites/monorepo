const fs = require('fs').promises;
const path = require('path');
const { Pool } = require('pg');
const MigrationRunner = require('../../database/migrations/migration-runner');

describe('Migration System Tests', () => {
  let pool;
  let migrationRunner;
  const testDbUrl = process.env.TEST_DATABASE_URL || 'postgresql://localhost:5432/transitos_test';

  beforeAll(async () => {
    // Conectar ao banco de dados de teste
    pool = new Pool({ connectionString: testDbUrl });

    // Limpar o banco de dados de teste
    await pool.query('DROP SCHEMA public CASCADE');
    await pool.query('CREATE SCHEMA public');
  });

  beforeEach(async () => {
    // Criar uma nova instância do MigrationRunner para cada teste
    migrationRunner = new MigrationRunner(testDbUrl);

    // Limpar tabela de migrações se existir
    try {
      await pool.query('DROP TABLE IF EXISTS schema_migrations');
    } catch (error) {
      console.error('Erro ao limpar tabela de migrações:', error);
    }
  });

  afterEach(async () => {
    // Fechar a conexão do MigrationRunner após cada teste
    await migrationRunner.close();
  });

  afterAll(async () => {
    // Fechar a conexão do pool após todos os testes
    await pool.end();
  });

  test('Deve criar a tabela de migrações', async () => {
    await migrationRunner.createMigrationsTable();

    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'schema_migrations'
    `);

    expect(result.rows.length).toBe(1);
    expect(result.rows[0].table_name).toBe('schema_migrations');
  });

  test('Deve retornar lista vazia de migrações aplicadas quando não há nenhuma', async () => {
    await migrationRunner.createMigrationsTable();
    const migrations = await migrationRunner.getAppliedMigrations();

    expect(migrations).toEqual([]);
  });

  test('Deve executar uma migração up', async () => {
    // Criar arquivo de migração temporário para teste
    const testMigrationDir = path.join(__dirname, '../../database/migrations');
    const testMigrationUp = path.join(testMigrationDir, 'test_up.sql');

    await fs.writeFile(testMigrationUp, `
      CREATE TABLE test_migration (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL
      );
    `);

    try {
      // Executar a migração
      await migrationRunner.createMigrationsTable();
      await migrationRunner.runMigration('test', 'up');

      // Verificar se a tabela foi criada
      const tableResult = await pool.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'test_migration'
      `);

      expect(tableResult.rows.length).toBe(1);

      // Verificar se a migração foi registrada
      const migrationResult = await pool.query(`
        SELECT version FROM schema_migrations WHERE version = 'test'
      `);

      expect(migrationResult.rows.length).toBe(1);
      expect(migrationResult.rows[0].version).toBe('test');
    } finally {
      // Limpar arquivo de migração temporário
      try {
        await fs.unlink(testMigrationUp);
      } catch (error) {
        console.error('Erro ao remover arquivo de migração temporário:', error);
      }
    }
  });

  test('Deve executar uma migração down', async () => {
    // Criar arquivos de migração temporários para teste
    const testMigrationDir = path.join(__dirname, '../../database/migrations');
    const testMigrationUp = path.join(testMigrationDir, 'test_up.sql');
    const testMigrationDown = path.join(testMigrationDir, 'test_down.sql');

    await fs.writeFile(testMigrationUp, `
      CREATE TABLE test_migration_down (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL
      );
    `);

    await fs.writeFile(testMigrationDown, `
      DROP TABLE test_migration_down;
    `);

    try {
      // Executar a migração up
      await migrationRunner.createMigrationsTable();
      await migrationRunner.runMigration('test', 'up');

      // Verificar se a tabela foi criada
      let tableResult = await pool.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'test_migration_down'
      `);

      expect(tableResult.rows.length).toBe(1);

      // Executar a migração down
      await migrationRunner.runMigration('test', 'down');

      // Verificar se a tabela foi removida
      tableResult = await pool.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'test_migration_down'
      `);

      expect(tableResult.rows.length).toBe(0);

      // Verificar se a migração foi removida do registro
      const migrationResult = await pool.query(`
        SELECT version FROM schema_migrations WHERE version = 'test'
      `);

      expect(migrationResult.rows.length).toBe(0);
    } finally {
      // Limpar arquivos de migração temporários
      try {
        await fs.unlink(testMigrationUp);
        await fs.unlink(testMigrationDown);
      } catch (error) {
        console.error('Erro ao remover arquivos de migração temporários:', error);
      }
    }
  });

  test('Deve executar migrações pendentes', async () => {
    // Criar arquivos de migração temporários para teste
    const testMigrationDir = path.join(__dirname, '../../database/migrations');
    const testMigration1Up = path.join(testMigrationDir, '001_test_up.sql');
    const testMigration2Up = path.join(testMigrationDir, '002_test_up.sql');

    await fs.writeFile(testMigration1Up, `
      CREATE TABLE test_migration_1 (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL
      );
    `);

    await fs.writeFile(testMigration2Up, `
      CREATE TABLE test_migration_2 (
        id SERIAL PRIMARY KEY,
        description TEXT
      );
    `);

    try {
      // Executar migrações pendentes
      await migrationRunner.runPendingMigrations();

      // Verificar se as tabelas foram criadas
      const tableResult = await pool.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name IN ('test_migration_1', 'test_migration_2')
        ORDER BY table_name
      `);

      expect(tableResult.rows.length).toBe(2);
      expect(tableResult.rows[0].table_name).toBe('test_migration_1');
      expect(tableResult.rows[1].table_name).toBe('test_migration_2');

      // Verificar se as migrações foram registradas
      const migrationResult = await pool.query(`
        SELECT version FROM schema_migrations ORDER BY version
      `);

      expect(migrationResult.rows[0].version).toBe('001_test');
      expect(migrationResult.rows[1].version).toBe('002_test');
    } finally {
      // Limpar arquivos de migração temporários
      try {
        await fs.unlink(testMigration1Up);
        await fs.unlink(testMigration2Up);
      } catch (error) {
        console.error('Erro ao remover arquivos de migração temporários:', error);
      }
    }
  });

  test('Deve lidar com erros em migrações', async () => {
    // Criar arquivo de migração com erro
    const testMigrationDir = path.join(__dirname, '../../database/migrations');
    const testMigrationUp = path.join(testMigrationDir, 'error_up.sql');

    await fs.writeFile(testMigrationUp, `
      CREATE TABLE test_migration_error (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL
      );

      -- Erro de sintaxe SQL proposital
      SELECT * FROM tabela_inexistente;
    `);

    try {
      // Tentar executar a migração com erro
      await migrationRunner.createMigrationsTable();

      let error;
      try {
        await migrationRunner.runMigration('error', 'up');
      } catch (e) {
        error = e;
      }

      // Verificar que ocorreu um erro
      expect(error).toBeDefined();

      // Verificar que a tabela não foi criada (rollback funcionou)
      const tableResult = await pool.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'test_migration_error'
      `);

      expect(tableResult.rows.length).toBe(0);

      // Verificar que a migração não foi registrada
      const migrationResult = await pool.query(`
        SELECT version FROM schema_migrations WHERE version = 'error'
      `);

      expect(migrationResult.rows.length).toBe(0);
    } finally {
      // Limpar arquivo de migração temporário
      try {
        await fs.unlink(testMigrationUp);
      } catch (error) {
        console.error('Erro ao remover arquivo de migração temporário:', error);
      }
    }
  });

  test('Deve ignorar migrações já aplicadas', async () => {
    // Criar arquivo de migração temporário para teste
    const testMigrationDir = path.join(__dirname, '../../database/migrations');
    const testMigrationUp = path.join(testMigrationDir, 'applied_up.sql');

    await fs.writeFile(testMigrationUp, `
      CREATE TABLE test_migration_applied (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL
      );
    `);

    try {
      // Executar a migração
      await migrationRunner.createMigrationsTable();
      await migrationRunner.runMigration('applied', 'up');

      // Verificar que a tabela foi criada
      const tableResult = await pool.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'test_migration_applied'
      `);

      expect(tableResult.rows.length).toBe(1);

      // Modificar o arquivo de migração para detectar se for executado novamente
      await fs.writeFile(testMigrationUp, `
        CREATE TABLE test_migration_applied (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          extra_column VARCHAR(100)
        );
      `);

      // Executar migrações pendentes novamente
      await migrationRunner.runPendingMigrations();

      // Verificar que a estrutura da tabela não mudou (migração não foi executada novamente)
      const columnResult = await pool.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'test_migration_applied'
        AND column_name = 'extra_column'
      `);

      expect(columnResult.rows.length).toBe(0);
    } finally {
      // Limpar arquivo de migração temporário
      try {
        await fs.unlink(testMigrationUp);
      } catch (error) {
        console.error('Erro ao remover arquivo de migração temporário:', error);
      }
    }
  });
});
