jest.mock('../../middleware/logging', () => ({
    info: jest.fn(),
    error: jest.fn(),
    audit: jest.fn(),
}));

jest.mock('../../config/services', () => ({
    __esModule: true,
    default: {
        zenodo: {
            enabled: true,
            accessToken: 'test-token',
            baseUrl: 'https://sandbox.zenodo.org',
            license: 'cc-by-4.0',
            community: '',
        },
    },
}));

import zenodoService from '../../services/zenodo';

const submission = {
    id: 'submission-123',
    title: 'Artigo de teste',
    summary: 'Resumo com mais de cinquenta caracteres para validar o fluxo básico.',
    content: '<p>Conteúdo do artigo.</p>',
    keywords: ['história', 'atlântico'],
    category: 'pessoa',
    author_name: 'Silva, João',
    author_institution: 'IEA-USP',
    metadata: {
        bibliography: ['Referência 1'],
    },
};

describe('ZenodoService', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    test('buildMetadataFromSubmission maps submission fields', () => {
        const metadata = zenodoService.buildMetadataFromSubmission(
            submission,
            'https://enciclopedia.iea.usp.br/artigo/artigo-de-teste'
        );

        expect(metadata.title).toBe(submission.title);
        expect(metadata.upload_type).toBe('publication');
        expect(metadata.creators[0].name).toBe('Silva, João');
        expect(metadata.keywords).toEqual(['história', 'atlântico', 'pessoa']);
        expect(metadata.related_identifiers?.[0].identifier).toContain('artigo-de-teste');
    });

    test('depositArticle creates deposition and uploads HTML without publishing', async () => {
        global.fetch = jest.fn()
            .mockResolvedValueOnce({
                ok: true,
                status: 201,
                json: async () => ({
                    id: 99,
                    state: 'unsubmitted',
                    links: {
                        bucket: 'https://sandbox.zenodo.org/api/files/bucket-uuid',
                    },
                    metadata: {
                        prereserve_doi: { doi: '10.5072/zenodo.99', recid: 99 },
                    },
                }),
            })
            .mockResolvedValueOnce({ ok: true, status: 200 })
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    id: 99,
                    state: 'unsubmitted',
                    links: {},
                    metadata: {
                        prereserve_doi: { doi: '10.5072/zenodo.99', recid: 99 },
                    },
                }),
            }) as jest.Mock;

        const result = await zenodoService.depositArticle(submission, {
            articleUrl: 'https://enciclopedia.iea.usp.br/artigo/artigo-de-teste',
            publish: false,
        });

        expect(result.depositionId).toBe(99);
        expect(result.doi).toBe('10.5072/zenodo.99');
        expect(result.state).toBe('unsubmitted');
        expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    test('retries a temporary Zenodo 403 traffic block before succeeding', async () => {
        global.fetch = jest.fn()
            .mockResolvedValueOnce({
                ok: false,
                status: 403,
                text: async () => 'Access to this resource has been restricted due to unusual traffic from your network.',
            })
            .mockResolvedValueOnce({
                ok: true,
                status: 201,
                json: async () => ({
                    id: 101,
                    state: 'unsubmitted',
                    links: {
                        bucket: 'https://sandbox.zenodo.org/api/files/bucket-uuid',
                    },
                    metadata: {},
                }),
            })
            .mockResolvedValueOnce({ ok: true, status: 200 })
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    id: 101,
                    state: 'unsubmitted',
                    links: {},
                    metadata: {},
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                status: 202,
                json: async () => ({
                    id: 101,
                    state: 'done',
                    doi: '10.5072/zenodo.101',
                    doi_url: 'https://doi.org/10.5072/zenodo.101',
                    record_url: 'https://sandbox.zenodo.org/record/101',
                    links: {
                        record_html: 'https://sandbox.zenodo.org/record/101',
                    },
                    metadata: {
                        doi: '10.5072/zenodo.101',
                    },
                }),
            }) as jest.Mock;

        const result = await zenodoService.depositArticle(submission, { publish: true });

        expect(result.doi).toBe('10.5072/zenodo.101');
        expect(global.fetch).toHaveBeenCalledTimes(5);
        const firstCallHeaders = (global.fetch as jest.Mock).mock.calls[0][1].headers;
        expect(firstCallHeaders['User-Agent']).toContain('Transitos');
    });

    test('depositArticle publishes when publish option is true', async () => {
        global.fetch = jest.fn()
            .mockResolvedValueOnce({
                ok: true,
                status: 201,
                json: async () => ({
                    id: 100,
                    state: 'unsubmitted',
                    links: {
                        bucket: 'https://sandbox.zenodo.org/api/files/bucket-uuid',
                    },
                    metadata: {},
                }),
            })
            .mockResolvedValueOnce({ ok: true, status: 200 })
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    id: 100,
                    state: 'unsubmitted',
                    links: {},
                    metadata: {},
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                status: 202,
                json: async () => ({
                    id: 100,
                    state: 'done',
                    doi: '10.5072/zenodo.100',
                    doi_url: 'https://doi.org/10.5072/zenodo.100',
                    record_url: 'https://sandbox.zenodo.org/record/100',
                    links: {
                        record_html: 'https://sandbox.zenodo.org/record/100',
                    },
                    metadata: {
                        doi: '10.5072/zenodo.100',
                    },
                }),
            }) as jest.Mock;

        const result = await zenodoService.depositArticle(submission, { publish: true });

        expect(result.doi).toBe('10.5072/zenodo.100');
        expect(result.recordUrl).toBe('https://sandbox.zenodo.org/record/100');
        expect(global.fetch).toHaveBeenCalledTimes(4);
    });
});
