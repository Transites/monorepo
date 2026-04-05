process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import untypedLogger from '../middleware/logging';
import {LoggerWithAudit} from "../types/migration";
import * as dotenv from 'dotenv';
import * as path from 'path';
import https from 'https';


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

class openserachIngestion {

    constructor() {
    }

    /**
     * A reusable, type-safe POST request wrapper
     * @template T The type of the request body
     * @template R The type of the expected response body
     */
    async post_request<T, R>(
        url: string, 
        payload: string, // Changed to string since it's NDJSON
        token?: string
    ): Promise<R> {
        const urlObj = new URL(url);
        
        const options: https.RequestOptions = {
            method: 'POST',
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname,
            headers: {
                'Content-Type': 'application/x-ndjson',
            },
            // This is the "ignore self-signed certs" part for the native module
            rejectUnauthorized: false 
        };

        if (token && options.headers) {
            const basicAuth = Buffer.from(`admin:${token}`).toString('base64');
            options.headers['Authorization'] = `Basic ${basicAuth}`;
        }

        return new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        // OpenSearch bulk response is JSON
                        resolve(JSON.parse(data) as R);
                    } catch (e) {
                        reject(new Error(`Failed to parse response: ${data}`));
                    }
                });
            });

            req.on('error', (err) => {
                console.error("Request Error:", err);
                reject(err);
            });

            req.write(payload);
            req.end();
        });
    }

    parse_articles(data: RawArticle[]): Article[] {
        return data.map((item) => ({
            id: String(item.id),
            status: String(item.status),
            author_name: String(item.author_name),
            author_institution: String(item.author_institution),
            title: String(item.title),
            summary: String(item.summary),
            content: String(item.content),

            keywords: Array.isArray(item.keywords)
            ? item.keywords.map((k: any) => String(k))
            : [],
        }));
    }

    generate_request_body(articles: Article[]): string {
        return articles
            .map(article => {
                const action = { index: { _index: "articles", _id: article.id } };
                const doc = { ...article };
                return JSON.stringify(action) + "\n" + JSON.stringify(doc);
            })
            .join("\n") + "\n";
    }
}

export default new openserachIngestion();