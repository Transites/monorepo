export interface ZenodoCreator {
    name: string;
    affiliation?: string;
    orcid?: string;
}

export interface ZenodoRelatedIdentifier {
    identifier: string;
    relation: string;
    scheme: 'doi' | 'url' | 'handle';
}

export interface ZenodoDepositionMetadata {
    title: string;
    upload_type: 'publication' | 'dataset' | 'software' | 'poster' | 'presentation' | 'image' | 'video' | 'other';
    publication_type?: 'article' | 'preprint' | 'book' | 'thesis' | 'other';
    description: string;
    creators: ZenodoCreator[];
    keywords?: string[];
    license?: string;
    prereserve_doi?: boolean;
    communities?: Array<{ identifier: string }>;
    related_identifiers?: ZenodoRelatedIdentifier[];
}

export interface ZenodoDepositionLinks {
    bucket?: string;
    publish?: string;
    record_html?: string;
    latest_draft_html?: string;
    self?: string;
}

export interface ZenodoDeposition {
    id: number;
    state: string;
    links: ZenodoDepositionLinks;
    metadata: ZenodoDepositionMetadata & {
        doi?: string;
        prereserve_doi?: { doi: string; recid: number };
    };
    doi?: string;
    doi_url?: string;
    record_id?: number;
    record_url?: string;
    conceptrecid?: string;
}

export interface ZenodoArticleInput {
    id: string;
    title: string;
    summary: string;
    content: string;
    keywords?: string[];
    category?: string;
    author_name: string;
    author_institution?: string;
    metadata?: Record<string, unknown>;
}

export interface ZenodoDepositResult {
    depositionId: number;
    doi?: string;
    doiUrl?: string;
    recordUrl?: string;
    conceptRecid?: string;
    state: string;
}

export interface ZenodoDepositOptions {
    articleUrl?: string;
    publish?: boolean;
    filename?: string;
}
