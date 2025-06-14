const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

describe('Database Schema Tests', () => {
  let pool;

  beforeAll(async () => {
    // Conectar ao banco de dados de teste
    pool = new Pool({
      connectionString: process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/transitos_test',
    });

    // Limpar o banco de dados de teste
    await pool.query('DROP SCHEMA public CASCADE');
    await pool.query('CREATE SCHEMA public');

    // Carregar e executar o schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    await pool.query(schema);
  });

  afterAll(async () => {
    await pool.end();
  });

  test('Deve ter as extensões necessárias instaladas', async () => {
    const result = await pool.query(`
      SELECT * FROM pg_extension
      WHERE extname IN ('uuid-ossp', 'pg_trgm')
    `);
    expect(result.rows.length).toBe(2);
  });

  test('Deve ter os tipos enum criados corretamente', async () => {
    const result = await pool.query(`
      SELECT typname, enumlabel
      FROM pg_type
      JOIN pg_enum ON pg_enum.enumtypid = pg_type.oid
      WHERE typname IN ('submission_status', 'feedback_status')
      ORDER BY typname, enumsortorder
    `);

    // Verificar submission_status
    const submissionStatuses = result.rows
      .filter(row => row.typname === 'submission_status')
      .map(row => row.enumlabel);

    expect(submissionStatuses).toEqual([
      'DRAFT', 'UNDER_REVIEW', 'CHANGES_REQUESTED',
      'APPROVED', 'PUBLISHED', 'REJECTED', 'EXPIRED'
    ]);

    // Verificar feedback_status
    const feedbackStatuses = result.rows
      .filter(row => row.typname === 'feedback_status')
      .map(row => row.enumlabel);

    expect(feedbackStatuses).toEqual([
      'PENDING', 'ADDRESSED', 'RESOLVED'
    ]);
  });

  test('Deve ter todas as tabelas criadas', async () => {
    const result = await pool.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
    `);

    const tables = result.rows.map(row => row.tablename);

    expect(tables).toContain('admins');
    expect(tables).toContain('submissions');
    expect(tables).toContain('articles');
    expect(tables).toContain('feedback');
    expect(tables).toContain('submission_versions');
    expect(tables).toContain('audit_logs');
  });

  test('Tabela admins deve ter as colunas corretas', async () => {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'admins'
      ORDER BY ordinal_position
    `);

    const columns = result.rows.map(row => ({
      name: row.column_name,
      type: row.data_type,
      nullable: row.is_nullable === 'YES'
    }));

    expect(columns).toContainEqual({ name: 'id', type: 'uuid', nullable: false });
    expect(columns).toContainEqual({ name: 'email', type: 'character varying', nullable: false });
    expect(columns).toContainEqual({ name: 'password_hash', type: 'character varying', nullable: false });
    expect(columns).toContainEqual({ name: 'name', type: 'character varying', nullable: false });
    expect(columns).toContainEqual({ name: 'is_active', type: 'boolean', nullable: true });
    expect(columns).toContainEqual({ name: 'last_login', type: 'timestamp without time zone', nullable: true });
    expect(columns).toContainEqual({ name: 'created_at', type: 'timestamp without time zone', nullable: true });
    expect(columns).toContainEqual({ name: 'updated_at', type: 'timestamp without time zone', nullable: true });
  });

  test('Tabela submissions deve ter as colunas corretas', async () => {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'submissions'
      ORDER BY ordinal_position
    `);

    const columns = result.rows.map(row => ({
      name: row.column_name,
      type: row.data_type,
      nullable: row.is_nullable === 'YES'
    }));

    expect(columns).toContainEqual({ name: 'id', type: 'uuid', nullable: false });
    expect(columns).toContainEqual({ name: 'token', type: 'character varying', nullable: false });
    expect(columns).toContainEqual({ name: 'status', type: 'USER-DEFINED', nullable: true });
    expect(columns).toContainEqual({ name: 'author_name', type: 'character varying', nullable: false });
    expect(columns).toContainEqual({ name: 'author_email', type: 'character varying', nullable: false });
    expect(columns).toContainEqual({ name: 'title', type: 'text', nullable: false });
    expect(columns).toContainEqual({ name: 'content', type: 'text', nullable: true });
    expect(columns).toContainEqual({ name: 'keywords', type: 'ARRAY', nullable: true });
    expect(columns).toContainEqual({ name: 'metadata', type: 'jsonb', nullable: true });
    expect(columns).toContainEqual({ name: 'created_at', type: 'timestamp without time zone', nullable: true });
    expect(columns).toContainEqual({ name: 'updated_at', type: 'timestamp without time zone', nullable: true });
    expect(columns).toContainEqual({ name: 'expires_at', type: 'timestamp without time zone', nullable: true });
  });

  test('Tabela articles deve ter as colunas corretas', async () => {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'articles'
      ORDER BY ordinal_position
    `);

    const columns = result.rows.map(row => ({
      name: row.column_name,
      type: row.data_type,
      nullable: row.is_nullable === 'YES'
    }));

    expect(columns).toContainEqual({ name: 'id', type: 'uuid', nullable: false });
    expect(columns).toContainEqual({ name: 'submission_id', type: 'uuid', nullable: true });
    expect(columns).toContainEqual({ name: 'slug', type: 'character varying', nullable: false });
    expect(columns).toContainEqual({ name: 'title', type: 'text', nullable: false });
    expect(columns).toContainEqual({ name: 'content', type: 'text', nullable: false });
    expect(columns).toContainEqual({ name: 'view_count', type: 'integer', nullable: true });
    expect(columns).toContainEqual({ name: 'is_featured', type: 'boolean', nullable: true });
    expect(columns).toContainEqual({ name: 'published_at', type: 'timestamp without time zone', nullable: true });
    expect(columns).toContainEqual({ name: 'updated_at', type: 'timestamp without time zone', nullable: true });
  });

  test('Deve ter as chaves estrangeiras configuradas corretamente', async () => {
    const result = await pool.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM
        information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
    `);

    const foreignKeys = result.rows.map(row => ({
      table: row.table_name,
      column: row.column_name,
      foreignTable: row.foreign_table_name,
      foreignColumn: row.foreign_column_name
    }));

    expect(foreignKeys).toContainEqual({
      table: 'submissions',
      column: 'reviewed_by',
      foreignTable: 'admins',
      foreignColumn: 'id'
    });

    expect(foreignKeys).toContainEqual({
      table: 'articles',
      column: 'submission_id',
      foreignTable: 'submissions',
      foreignColumn: 'id'
    });

    expect(foreignKeys).toContainEqual({
      table: 'feedback',
      column: 'submission_id',
      foreignTable: 'submissions',
      foreignColumn: 'id'
    });

    expect(foreignKeys).toContainEqual({
      table: 'feedback',
      column: 'admin_id',
      foreignTable: 'admins',
      foreignColumn: 'id'
    });

    expect(foreignKeys).toContainEqual({
      table: 'submission_versions',
      column: 'submission_id',
      foreignTable: 'submissions',
      foreignColumn: 'id'
    });
  });

  test('Deve ter os índices criados corretamente', async () => {
    const result = await pool.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND indexname LIKE 'idx_%'
    `);

    const indexes = result.rows.map(row => row.indexname);

    expect(indexes).toContain('idx_submissions_status_created');
    expect(indexes).toContain('idx_submissions_author_email');
    expect(indexes).toContain('idx_submissions_title_search');
    expect(indexes).toContain('idx_articles_content_search');
    expect(indexes).toContain('idx_feedback_submission_status');
    expect(indexes).toContain('idx_audit_logs_created_at');
  });

  test('Deve ter as funções criadas corretamente', async () => {
    const result = await pool.query(`
      SELECT proname
      FROM pg_proc
      WHERE proname IN (
        'update_updated_at_column',
        'create_submission_version',
        'cleanup_expired_submissions',
        'audit_trigger_function'
      )
    `);

    const functions = result.rows.map(row => row.proname);

    expect(functions).toContain('update_updated_at_column');
    expect(functions).toContain('create_submission_version');
    expect(functions).toContain('cleanup_expired_submissions');
    expect(functions).toContain('audit_trigger_function');
  });

  test('Deve ter os triggers criados corretamente', async () => {
    const result = await pool.query(`
      SELECT trigger_name, event_manipulation, event_object_table
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
    `);

    const triggers = result.rows.map(row => ({
      name: row.trigger_name,
      event: row.event_manipulation,
      table: row.event_object_table
    }));

    expect(triggers).toContainEqual({
      name: 'update_admins_updated_at',
      event: 'UPDATE',
      table: 'admins'
    });

    expect(triggers).toContainEqual({
      name: 'update_submissions_updated_at',
      event: 'UPDATE',
      table: 'submissions'
    });

    expect(triggers).toContainEqual({
      name: 'create_submission_version_trigger',
      event: 'UPDATE',
      table: 'submissions'
    });

    expect(triggers).toContainEqual({
      name: 'audit_admins',
      event: 'INSERT',
      table: 'admins'
    });

    expect(triggers).toContainEqual({
      name: 'audit_submissions',
      event: 'UPDATE',
      table: 'submissions'
    });
  });

  test('Deve ter as constraints check criadas corretamente', async () => {
    const result = await pool.query(`
      SELECT table_name, constraint_name
      FROM information_schema.table_constraints
      WHERE constraint_type = 'CHECK'
      AND constraint_schema = 'public'
    `);

    const constraints = result.rows.map(row => ({
      table: row.table_name,
      name: row.constraint_name
    }));

    expect(constraints).toContainEqual({
      table: 'admins',
      name: 'admins_email_check'
    });

    expect(constraints).toContainEqual({
      table: 'submissions',
      name: 'submissions_title_check'
    });

    expect(constraints).toContainEqual({
      table: 'articles',
      name: 'articles_content_check'
    });

    expect(constraints).toContainEqual({
      table: 'feedback',
      name: 'feedback_content_check'
    });

    expect(constraints).toContainEqual({
      table: 'submission_versions',
      name: 'versions_number_check'
    });
  });
});
