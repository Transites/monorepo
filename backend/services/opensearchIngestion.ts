import untypedLogger from '../middleware/logging';
import { LoggerWithAudit } from "../types/migration";
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Client } from '@opensearch-project/opensearch';

dotenv.config({ path: path.resolve(__dirname, '../opensearch-cluster/.env') });

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

class OpenSearchIngestion {
    private client: Client;

    constructor() {
        this.client = new Client({
            node: 'https://opensearch-node1:9200',
            auth: {
                username: 'admin',
                password: process.env.OPENSEARCH_INITIAL_ADMIN_PASSWORD || '#Transitos01@',
            },
            ssl: {
                rejectUnauthorized: false, // Set to true and provide CA in production
            },
        });
    }

    parse_articles(data: any[]): Article[] {
        return data.map((item) => ({
            id: String(item.id),
            status: String(item.status),
            author_name: String(item.author_name),
            author_institution: String(item.author_institution),
            title: String(item.title),
            summary: String(item.summary),
            content: String(item.content),
            keywords: Array.isArray(item.keywords) ? item.keywords.map((k: any) => String(k)) : [],
        }));
    }

    async bulkIngest(articles: Article[]) {
        const body = articles.flatMap(doc => [
            { index: { _index: 'articles', _id: doc.id } },
            doc
        ]);

        const { body: bulkResponse } = await this.client.bulk({ refresh: true, body });

        if (bulkResponse.errors) {
            logger.error('Bulk ingestion had errors');
            return bulkResponse.items;
        }
        return bulkResponse;
    }

    async uploadArticle(articleData: any) {
        const doc = this.parse_articles([articleData])[0];
        const { id, ...article_body } = doc;

        const response = await this.client.index({
            index: 'articles',
            id: id,
            body: article_body,
            refresh: true,
        });

        return response.body;
    }
}

export default new OpenSearchIngestion();