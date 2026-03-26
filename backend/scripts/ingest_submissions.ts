// @ts-nocheck
import db from '../database/client';

import { Client } from '@opensearch-project/opensearch';

async function main() {
  console.log('Starting ingestion...');

  // Check environment variables
  console.log('OpenSearch Node:', process.env.OPENSEARCH_NODE);
  console.log('OpenSearch User:', process.env.OPENSEARCH_USERNAME);

  // Test database connection
  try {
    const testResult = await db.query('SELECT NOW()');
    console.log('Database connected:', testResult.rows[0]);
  } catch (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }

  const result = await db.query('SELECT * FROM submissions');
  console.log('Fetched rows:', result.rows.length);

  if (result.rows.length === 0) {
    console.log('No submissions found to ingest');
    return;
  }

  const docs = result.rows.map(row => ({
    id: row.id,
    title: row.title,
    content: row.content,
    author_name: row.author_name,
    author_institution: row.author_institution,
    keywords: row.keywords || [],
    created_at: row.created_at
  }));

  console.log('Prepared docs:', docs.length);

  const client = new Client({
    node: process.env.OPENSEARCH_NODE || 'https://localhost:9200',
    auth: {
      username: process.env.OPENSEARCH_USERNAME || 'admin',
      password: process.env.OPENSEARCH_PASSWORD || '#Transitos01@'
    },
    ssl: {
      rejectUnauthorized: false
    }
  });

  // Test OpenSearch connection
  try {
    const info = await client.info();
    console.log('OpenSearch connected:', info.body.version.number);
  } catch (err) {
    console.error('OpenSearch connection failed:', err);
    process.exit(1);
  }

  const bulkBody = docs.flatMap(doc => [
    { index: { _index: 'submissions', _id: doc.id } },
    doc
  ]);

  const { body: bulkResponse } = await client.bulk({
    refresh: true,
    body: bulkBody
  });

  if (bulkResponse.errors) {
    const erroredDocs = [];
    bulkResponse.items.forEach((action: any, i: number) => {
      const operation = Object.keys(action)[0];
      if (action[operation].error) {
        erroredDocs.push({
          status: action[operation].status,
          error: action[operation].error,
          doc: docs[i]
        });
      }
    });
    console.error('Errors in bulk ingestion:', JSON.stringify(erroredDocs, null, 2));
    process.exit(1);
  } else {
    console.log(`✅ Bulk ingestion completed successfully! Indexed ${docs.length} documents.`);
  }
}

main().catch(err => {
  console.error('Error in ingestion:', err);
  process.exit(1);
});