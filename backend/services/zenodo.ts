import config from '../config/services';
import untypedLogger from '../middleware/logging';
import { LoggerWithAudit } from '../types/migration';
import {
    ZenodoArticleInput,
    ZenodoDepositOptions,
    ZenodoDepositResult,
    ZenodoDeposition,
    ZenodoDepositionMetadata,
} from '../types/zenodo';

const logger = untypedLogger as unknown as LoggerWithAudit;

interface ZenodoConfig {
    enabled: boolean;
    accessToken: string;
    baseUrl: string;
    license: string;
    community?: string;
}

class ZenodoService {
    private readonly zenodoConfig: ZenodoConfig;

    constructor() {
        this.zenodoConfig = {
            enabled: config.zenodo.enabled,
            accessToken: config.zenodo.accessToken,
            baseUrl: config.zenodo.baseUrl.replace(/\/$/, ''),
            license: config.zenodo.license,
            community: config.zenodo.community || undefined,
        };

        if (this.zenodoConfig.enabled) {
            logger.info('Zenodo integration enabled', {
                baseUrl: this.zenodoConfig.baseUrl,
                hasCommunity: Boolean(this.zenodoConfig.community),
            });
        }
    }

    public isEnabled(): boolean {
        return this.zenodoConfig.enabled;
    }

    private assertEnabled(): void {
        if (!this.zenodoConfig.enabled) {
            throw new Error('Zenodo integration is disabled. Set ZENODO_ENABLED=true to use it.');
        }

        if (!this.zenodoConfig.accessToken) {
            throw new Error('ZENODO_ACCESS_TOKEN is required when Zenodo integration is enabled.');
        }
    }

    private authHeaders(contentType?: string): Record<string, string> {
        const headers: Record<string, string> = {
            Authorization: `Bearer ${this.zenodoConfig.accessToken}`,
        };

        if (contentType) {
            headers['Content-Type'] = contentType;
        }

        return headers;
    }

    private async request<T>(
        path: string,
        options: RequestInit = {}
    ): Promise<T> {
        this.assertEnabled();

        const url = `${this.zenodoConfig.baseUrl}${path}`;
        const response = await fetch(url, options);

        if (!response.ok) {
            const body = await response.text();
            throw new Error(`Zenodo API error ${response.status} on ${path}: ${body}`);
        }

        if (response.status === 204) {
            return undefined as T;
        }

        return response.json() as Promise<T>;
    }

    public buildMetadataFromSubmission(
        submission: ZenodoArticleInput,
        articleUrl?: string
    ): ZenodoDepositionMetadata {
        const keywords = [
            ...(submission.keywords ?? []),
            ...(submission.category ? [submission.category] : []),
        ];

        const metadata: ZenodoDepositionMetadata = {
            title: submission.title,
            upload_type: 'publication',
            publication_type: 'other',
            description: submission.summary,
            creators: [{
                name: submission.author_name,
                affiliation: submission.author_institution || 'IEA-USP',
            }],
            keywords: keywords.length > 0 ? keywords : undefined,
            license: this.zenodoConfig.license,
            prereserve_doi: true,
        };

        if (this.zenodoConfig.community) {
            metadata.communities = [{ identifier: this.zenodoConfig.community }];
        }

        if (articleUrl) {
            metadata.related_identifiers = [{
                identifier: articleUrl,
                relation: 'isPublishedIn',
                scheme: 'url',
            }];
        }

        return metadata;
    }

    public buildArticleHtml(submission: ZenodoArticleInput, articleUrl?: string): string {
        const bibliography = submission.metadata?.bibliography;
        const bibliographyHtml = Array.isArray(bibliography) && bibliography.length > 0
            ? `<section><h2>Referências</h2><ul>${bibliography
                .map((item) => `<li>${String(item)}</li>`)
                .join('')}</ul></section>`
            : '';

        const sourceLink = articleUrl
            ? `<p><a href="${articleUrl}">Ver na Enciclopédia Transitos</a></p>`
            : '';

        return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${submission.title}</title>
</head>
<body>
  <article>
    <header>
      <h1>${submission.title}</h1>
      <p><strong>Autor:</strong> ${submission.author_name}</p>
      ${submission.author_institution ? `<p><strong>Instituição:</strong> ${submission.author_institution}</p>` : ''}
      ${sourceLink}
    </header>
    <section>
      <h2>Resumo</h2>
      <p>${submission.summary}</p>
    </section>
    <section>
      <h2>Conteúdo</h2>
      ${submission.content}
    </section>
    ${bibliographyHtml}
  </article>
</body>
</html>`;
    }

    public async createDeposition(metadata: ZenodoDepositionMetadata): Promise<ZenodoDeposition> {
        return this.request<ZenodoDeposition>('/api/deposit/depositions', {
            method: 'POST',
            headers: this.authHeaders('application/json'),
            body: JSON.stringify({ metadata }),
        });
    }

    public async updateDeposition(
        depositionId: number,
        metadata: ZenodoDepositionMetadata
    ): Promise<ZenodoDeposition> {
        return this.request<ZenodoDeposition>(`/api/deposit/depositions/${depositionId}`, {
            method: 'PUT',
            headers: this.authHeaders('application/json'),
            body: JSON.stringify({ metadata }),
        });
    }

    public async uploadFile(
        bucketUrl: string,
        filename: string,
        content: Buffer | string,
        contentType = 'application/octet-stream'
    ): Promise<void> {
        this.assertEnabled();

        const body = typeof content === 'string' ? Buffer.from(content, 'utf-8') : content;
        const response = await fetch(`${bucketUrl}/${encodeURIComponent(filename)}`, {
            method: 'PUT',
            headers: this.authHeaders(contentType),
            body,
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Zenodo file upload failed (${response.status}): ${errorBody}`);
        }
    }

    public async publishDeposition(depositionId: number): Promise<ZenodoDeposition> {
        return this.request<ZenodoDeposition>(
            `/api/deposit/depositions/${depositionId}/actions/publish`,
            {
                method: 'POST',
                headers: this.authHeaders(),
            }
        );
    }

    public async depositArticle(
        submission: ZenodoArticleInput,
        options: ZenodoDepositOptions = {}
    ): Promise<ZenodoDepositResult> {
        const metadata = this.buildMetadataFromSubmission(submission, options.articleUrl);
        const deposition = await this.createDeposition(metadata);

        if (!deposition.links.bucket) {
            throw new Error('Zenodo deposition did not return a file bucket URL.');
        }

        const filename = options.filename ?? `${submission.id}.html`;
        const html = this.buildArticleHtml(submission, options.articleUrl);
        await this.uploadFile(deposition.links.bucket, filename, html);
        await this.updateDeposition(deposition.id, metadata);

        let finalDeposition = deposition;

        if (options.publish) {
            finalDeposition = await this.publishDeposition(deposition.id);
        }

        const doi = finalDeposition.metadata?.doi
            ?? finalDeposition.doi
            ?? finalDeposition.metadata?.prereserve_doi?.doi;

        logger.audit('Zenodo deposition created', {
            submissionId: submission.id,
            depositionId: finalDeposition.id,
            published: Boolean(options.publish),
            doi,
        });

        return {
            depositionId: finalDeposition.id,
            doi,
            doiUrl: finalDeposition.doi_url,
            recordUrl: finalDeposition.record_url ?? finalDeposition.links.record_html,
            conceptRecid: finalDeposition.conceptrecid,
            state: finalDeposition.state,
        };
    }
}

export default new ZenodoService();
