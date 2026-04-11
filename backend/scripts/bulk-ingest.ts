process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import db from '../database/client';
import untypedLogger from '../middleware/logging';
import {LoggerWithAudit} from "../types/migration";
import {SubmissionNotFoundException, DatabaseException} from '../utils/exceptions';
import * as dotenv from 'dotenv';
import * as path from 'path';
import opensearchIngestion from '../services/opensearchIngestion';

dotenv.config({ path: path.resolve(__dirname, '../opensearch-cluster/.env') });
const OPENSEARCH_PASSWORD = process.env.OPENSEARCH_INITIAL_ADMIN_PASSWORD || '';

const logger = untypedLogger as unknown as LoggerWithAudit;

interface Article {
    id: string;
    status: string;
    author_name: string;
    author_institution: string;
    title: string;
    summary: string;
    content: string;
    keywords: string[];
}

type RawArticle = any;

async function query_all_data(): Promise<any> {
    try {
        const submissionResult = await db.query('SELECT * FROM submissions');
        const formattedResult = opensearchIngestion.parse_articles(submissionResult.rows);
        return formattedResult;
    } catch (error: any) {
        logger.error('Error getting submissions.', { error: error?.message });
    
        if(error instanceof SubmissionNotFoundException) { throw error; }
        throw new DatabaseException('Erro ao buscar submissão', error);
    }
}

async function ingest_data() {
    const apiUrl = "https://opensearch-node1:9200/_bulk"; 
    const formatted_query_data = await query_all_data();
    const request_body = opensearchIngestion.generate_request_body(formatted_query_data);
    try {
        const result = await opensearchIngestion.post_request<any, any>(apiUrl, request_body, OPENSEARCH_PASSWORD);
        
        console.log("Success! Opensearch response:");
        console.log(result);
    } catch (err) {
        console.error("Ingestion Failed:", err instanceof Error ? err.message : err);
    }
}

ingest_data();
