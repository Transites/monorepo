import opensearchIngestion from '../services/opensearchIngestion';
import db from '../database/client';

async function runFullSync() {
    try {
        const result = await db.query('SELECT * FROM submissions');
        console.log(`Fetched ${result.rows.length} submissions from DB.`);
        const formattedArticles = opensearchIngestion.parse_articles(result.rows);
        const response = await opensearchIngestion.bulkIngest(formattedArticles);
        process.exit(0);
    } catch (error) {
        console.error('Sync failed:', error);
        process.exit(1);
    }
}

async function setup() {
    const client = (opensearchIngestion as any).client;
    const indexName = 'articles';

    try {
        await client.indices.delete({ index: indexName }).catch(() => {});
        
        await client.indices.create({
            index: indexName,
            body: {
                "settings": {
                    "index": {
                    "max_ngram_diff": 8
                    },
                    "analysis": {
                    "filter": {
                        "autocomplete_filter": {
                        "type": "edge_ngram",
                        "min_gram": 2,
                        "max_gram": 10
                        },
                        "portuguese_stop": {
                        "type": "stop",
                        "stopwords": "_portuguese_"
                        },
                        "portuguese_stemmer": {
                        "type": "stemmer",
                        "language": "light_portuguese"
                        }
                    },
                    "analyzer": {
                        "autocomplete": {
                        "type": "custom",
                        "tokenizer": "standard",
                        "filter": [
                            "lowercase",
                            "asciifolding",
                            "portuguese_stop",
                            "portuguese_stemmer",
                            "autocomplete_filter"
                        ]
                        },
                        "autocomplete_search": {
                        "type": "custom",
                        "tokenizer": "standard",
                        "filter": [
                            "lowercase",
                            "asciifolding",
                            "portuguese_stop",
                            "portuguese_stemmer"
                        ]
                        }
                    }
                    }
                },
                "mappings": {
                    "properties": {
                    "id": { "type": "keyword" },
                    "status": { "type": "keyword" },
                    "title": { "type": "text", "analyzer": "autocomplete", "search_analyzer": "autocomplete_search" },
                    "summary": { "type": "text", "analyzer": "autocomplete", "search_analyzer": "autocomplete_search" },
                    "content": { "type": "text", "analyzer": "autocomplete", "search_analyzer": "autocomplete_search" },
                    "keywords": { "type": "text", "analyzer": "autocomplete", "search_analyzer": "autocomplete_search" }
                    }
                }
            }
        });
        console.log("Index configured with N-Grams and Stop Words.");
    } catch (e) {
        console.error(e);
    }

    await runFullSync();
}

setup();