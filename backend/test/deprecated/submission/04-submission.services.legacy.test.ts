import submissionService from '../../services/submission';
import db from '../../database/client';
import tokenService from '../../services/tokens';
import emailService from '../../services/email';
import constants from '../../utils/constants';
import { AuthorSubmissionsResult } from '../../services/submission';

// Mock dependencies
jest.mock('../../database/client');
jest.mock('../../services/tokens');
jest.mock('../../services/email');
jest.mock('../../middleware/logging', () => ({
    audit: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn()
}));

describe('SubmissionService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createSubmission', () => {
        const mockSubmissionData = {
            author_name: 'Test Author',
            author_email: 'test@example.com',
            title: 'Test Submission',
            summary: 'This is a test submission',
            content: 'This is the content of the test submission',
            keywords: ['test', 'submission'],
            category: 'Outros'
        };

        const mockToken = 'mock-token-123456789';
        const mockSubmissionId = 'mock-submission-id';

        beforeEach(() => {
            // Mock token generation
            (tokenService.generateSecureToken as jest.Mock).mockResolvedValue(mockToken);

            // Mock database transaction
            (db.transaction as jest.Mock).mockImplementation(async (callback) => {
                const mockClient = {
                    query: jest.fn().mockResolvedValue({
                        rows: [{
                            id: mockSubmissionId,
                            token: mockToken,
                            author_name: mockSubmissionData.author_name,
                            author_email: mockSubmissionData.author_email,
                            title: mockSubmissionData.title,
                            status: constants.SUBMISSION_STATUS.DRAFT,
                            created_at: new Date(),
                            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                        }]
                    })
                };
                return callback(mockClient);
            });
        });

        test('deve criar submissão com dados válidos', async () => {
            const result = await submissionService.createSubmission(mockSubmissionData);

            expect(result).toBeDefined();
            expect(result.id).toBe(mockSubmissionId);
            expect(result.token).toBe(mockToken);
            expect(result.author_name).toBe(mockSubmissionData.author_name);
            expect(result.author_email).toBe(mockSubmissionData.author_email);
            expect(result.title).toBe(mockSubmissionData.title);
            expect(result.status).toBe(constants.SUBMISSION_STATUS.DRAFT);

            expect(db.transaction).toHaveBeenCalled();
            expect(tokenService.generateSecureToken).toHaveBeenCalled();
        });

        test('deve rejeitar dados inválidos', async () => {
            const invalidData = {
                author_name: '',  // Nome inválido
                author_email: 'invalid-email',  // Email inválido
                title: 'Te'  // Título muito curto
            };

            await expect(submissionService.createSubmission(invalidData as any))
                .rejects.toThrow(/Dados inválidos/);
        });
    });

    describe('updateSubmission', () => {
        const mockSubmissionId = 'mock-submission-id';
        const mockAuthorEmail = 'test@example.com';

        const mockCurrentSubmission = {
            id: mockSubmissionId,
            author_name: 'Test Author',
            author_email: mockAuthorEmail,
            title: 'Original Title',
            summary: 'Original Summary',
            content: 'Original Content',
            status: constants.SUBMISSION_STATUS.DRAFT
        };

        const mockUpdateData = {
            title: 'Updated Title',
            summary: 'Updated Summary',
            content: 'Updated Content'
        };

        beforeEach(() => {
            // Mock findById
            (db.findById as jest.Mock).mockResolvedValue(mockCurrentSubmission);

            // Mock transaction
            (db.transaction as jest.Mock).mockImplementation(async (callback) => {
                const mockClient = {
                    query: jest.fn().mockResolvedValue({
                        rows: [{
                            ...mockCurrentSubmission,
                            ...mockUpdateData,
                            updated_at: new Date()
                        }]
                    })
                };
                return callback(mockClient);
            });
        });

        test('deve atualizar campos modificados', async () => {
            const result = await submissionService.updateSubmission(
                mockSubmissionId,
                mockUpdateData,
                mockAuthorEmail
            );

            expect(result).toBeDefined();
            expect(result.title).toBe(mockUpdateData.title);
            expect(result.summary).toBe(mockUpdateData.summary);
            expect(result.content).toBe(mockUpdateData.content);

            expect(db.findById).toHaveBeenCalledWith('submissions', mockSubmissionId);
            expect(db.transaction).toHaveBeenCalled();
        });

        test('deve rejeitar se status não permite edição', async () => {
            // Mock submission with non-editable status
            (db.findById as jest.Mock).mockResolvedValue({
                ...mockCurrentSubmission,
                status: constants.SUBMISSION_STATUS.UNDER_REVIEW
            });

            await expect(submissionService.updateSubmission(
                mockSubmissionId,
                mockUpdateData,
                mockAuthorEmail
            )).rejects.toThrow(/não pode ser editada/);
        });
    });

    describe('validateCompleteness', () => {
        test('deve identificar campos obrigatórios faltantes', () => {
            const incompleteSubmission = {
                title: 'Test Title',  // OK
                summary: 'Too short', // Too short
                content: 'Content is also too short', // Too short
                keywords: [],  // Empty
                category: null // Missing
            };

            const result = submissionService.validateCompleteness(incompleteSubmission);

            expect(result.isComplete).toBe(false);
            expect(result.missingFields).toContain('summary');
            expect(result.missingFields).toContain('content');
            expect(result.missingFields).toContain('keywords');
            expect(result.missingFields).toContain('category');
            expect(result.completenessPercentage).toBeLessThan(100);
        });

        test('deve validar submissão completa', () => {
            const completeSubmission = {
                title: 'Test Title',
                summary: 'This is a summary that is long enough to pass validation. It needs to be at least 50 characters.',
                content: 'This is the content of the submission. It needs to be at least 100 characters long to pass validation. So I am adding more text to make sure it passes.',
                keywords: ['test', 'submission'],
                category: 'Outros'
            };

            const result = submissionService.validateCompleteness(completeSubmission);

            expect(result.isComplete).toBe(true);
            expect(result.missingFields).toHaveLength(0);
            expect(result.completenessPercentage).toBe(100);
        });
    });

    describe('getSubmissionByToken', () => {
        const mockToken = 'mock-token-123456789';
        const mockSubmissionId = 'mock-submission-id';
        const mockSubmission = {
            id: mockSubmissionId,
            author_name: 'Test Author',
            author_email: 'test@example.com',
            title: 'Test Submission',
            status: constants.SUBMISSION_STATUS.DRAFT
        };

        beforeEach(() => {
            // Mock token validation
            (tokenService.validateToken as jest.Mock).mockResolvedValue({
                isValid: true,
                submission: mockSubmission,
                tokenInfo: { expiresIn: '30 days' }
            });

            // Mock database queries
            (db.query as jest.Mock).mockImplementation((query, params) => {
                if (query.includes('submission_attachments')) {
                    return Promise.resolve({
                        rows: [
                            {
                                id: 'att1',
                                filename: 'test.pdf',
                                url: 'http://test.com/test.pdf',
                                file_type: 'application/pdf',
                                size: 1024
                            }
                        ]
                    });
                } else if (query.includes('submission_versions')) {
                    return Promise.resolve({
                        rows: [
                            { id: 'ver1', version_number: 1, title: 'Version 1', created_at: new Date() }
                        ]
                    });
                } else if (query.includes('feedback')) {
                    return Promise.resolve({
                        rows: [
                            {
                                id: 'feed1',
                                admin_id: 'admin1',
                                admin_name: 'Admin User',
                                comment: 'Test feedback',
                                created_at: new Date()
                            }
                        ]
                    });
                }
                return Promise.resolve({ rows: [] });
            });
        });

        test('deve retornar submissão quando token é válido', async () => {
            const result = await submissionService.getSubmissionByToken(mockToken, true);

            expect(result.found).toBe(true);
            expect(result.submission).toBeDefined();
            expect(result.submission.id).toBe(mockSubmissionId);
            expect(result.submission.attachments).toHaveLength(1);
            expect(result.submission.versions).toHaveLength(1);
            expect(result.submission.feedback).toHaveLength(1);
            expect(result.tokenInfo).toBeDefined();

            expect(tokenService.validateToken).toHaveBeenCalledWith(mockToken);
            expect(db.query).toHaveBeenCalledTimes(3);
        });

        test('deve retornar found=false quando token é inválido', async () => {
            (tokenService.validateToken as jest.Mock).mockResolvedValue({
                isValid: false,
                reason: 'Token expirado',
                submission: null
            });

            const result = await submissionService.getSubmissionByToken(mockToken);

            expect(result.found).toBe(false);
            expect(result.reason).toBe('Token expirado');
            expect(result.submission).toBeNull();
        });

        test('deve buscar submissão sem versões quando includeVersions=false', async () => {
            const result = await submissionService.getSubmissionByToken(mockToken, false);

            expect(result.found).toBe(true);
            expect(result.submission).toBeDefined();
            expect(result.submission.attachments).toHaveLength(1);
            expect(result.submission.feedback).toHaveLength(1);
            expect(result.submission.versions).toEqual([]);

            // Verifica que a query de versões não foi chamada
            expect(db.query).toHaveBeenCalledTimes(2);
            expect((db.query as jest.Mock).mock.calls.every(call => !call[0].includes('submission_versions'))).toBe(true);
        });
    });

    describe('submitForReview', () => {
        const mockSubmissionId = 'mock-submission-id';
        const mockAuthorEmail = 'test@example.com';
        const mockCompleteSubmission = {
            id: mockSubmissionId,
            author_name: 'Test Author',
            author_email: mockAuthorEmail,
            title: 'Test Submission',
            summary: 'This is a summary that is long enough to pass validation. It needs to be at least 50 characters.',
            content: 'This is the content of the submission. It needs to be at least 100 characters long to pass validation. So I am adding more text to make sure it passes.',
            keywords: ['test', 'submission'],
            category: 'Outros',
            status: constants.SUBMISSION_STATUS.DRAFT
        };

        beforeEach(() => {
            (db.findById as jest.Mock).mockResolvedValue(mockCompleteSubmission);

            (db.transaction as jest.Mock).mockImplementation(async (callback) => {
                const mockClient = {
                    query: jest.fn().mockImplementation((query, params) => {
                        if (query.includes('UPDATE submissions')) {
                            return Promise.resolve({
                                rows: [{
                                    ...mockCompleteSubmission,
                                    status: constants.SUBMISSION_STATUS.UNDER_REVIEW,
                                    submitted_at: new Date(),
                                    updated_at: new Date()
                                }]
                            });
                        } else if (query.includes('SELECT email FROM admins')) {
                            return Promise.resolve({
                                rows: [
                                    { email: 'admin1@example.com' },
                                    { email: 'admin2@example.com' }
                                ]
                            });
                        } else if (query.includes('SELECT COALESCE(MAX(version_number), 0) + 1')) {
                            return Promise.resolve({
                                rows: [{ next_version: 1 }]
                            });
                        } else if (query.includes('SELECT s.*')) {
                            return Promise.resolve({
                                rows: [{
                                    ...mockCompleteSubmission,
                                    version_count: '1',
                                    attachment_count: '1',
                                    feedback_count: '0',
                                    days_since_creation: '10',
                                    days_to_expiry: '20'
                                }]
                            });
                        }
                        return Promise.resolve({ rows: [] });
                    })
                };
                return callback(mockClient);
            });

            // Mock token renewal
            (tokenService.renewToken as jest.Mock).mockResolvedValue({ success: true });

            // Mock email notification
            (emailService.notifyAdminNewSubmission as jest.Mock).mockResolvedValue({ success: true });
        });

        test('deve enviar submissão completa para revisão', async () => {
            const result = await submissionService.submitForReview(mockSubmissionId, mockAuthorEmail);

            expect(result).toBeDefined();
            expect(result.status).toBe(constants.SUBMISSION_STATUS.UNDER_REVIEW);
            expect(result.submitted_at).toBeDefined();

            expect(db.findById).toHaveBeenCalledWith('submissions', mockSubmissionId);
            expect(db.transaction).toHaveBeenCalled();
            expect(tokenService.renewToken).toHaveBeenCalledWith(mockSubmissionId, 30);

            // Verificar que setImmediate foi chamado para enviar emails
            // Como setImmediate é assíncrono, precisamos esperar um pouco
            await new Promise(resolve => setTimeout(resolve, 10));
            expect(emailService.notifyAdminNewSubmission).toHaveBeenCalled();
        });

        test('deve rejeitar submissão incompleta', async () => {
            // Mock submissão incompleta
            (db.findById as jest.Mock).mockResolvedValue({
                ...mockCompleteSubmission,
                summary: 'Too short', // Summary muito curto
                keywords: [] // Keywords vazios
            });

            await expect(submissionService.submitForReview(mockSubmissionId, mockAuthorEmail))
                .rejects.toThrow(/Submissão incompleta/);

            expect(db.transaction).not.toHaveBeenCalled();
        });

        test('deve rejeitar submissão com status inválido', async () => {
            // Mock submissão com status inválido
            (db.findById as jest.Mock).mockResolvedValue({
                ...mockCompleteSubmission,
                status: constants.SUBMISSION_STATUS.UNDER_REVIEW // Já está em revisão
            });

            await expect(submissionService.submitForReview(mockSubmissionId, mockAuthorEmail))
                .rejects.toThrow(/não pode ser enviada no status/);

            expect(db.transaction).not.toHaveBeenCalled();
        });
    });

    describe('addAttachment', () => {
        const mockSubmissionId = 'mock-submission-id';
        const mockAttachmentData = {
            filename: 'test-file.pdf',
            url: 'https://example.com/test-file.pdf',
            file_type: 'application/pdf',
            size: 1024 * 1024, // 1MB
            metadata: { description: 'Test file' }
        };
        const mockAttachmentId = 'mock-attachment-id';

        beforeEach(() => {
            // Reset mocks
            jest.clearAllMocks();

            // Mock database queries
            (db.query as jest.Mock).mockImplementation((query, params) => {
                if (query.includes('SELECT COUNT(*)')) {
                    return Promise.resolve({
                        rows: [{ count: '2' }] // Simula 2 anexos existentes
                    });
                } else if (query.includes('INSERT INTO submission_attachments')) {
                    return Promise.resolve({
                        rows: [{
                            id: mockAttachmentId,
                            submission_id: mockSubmissionId,
                            ...mockAttachmentData,
                            created_at: new Date()
                        }]
                    });
                }
                return Promise.resolve({ rows: [] });
            });
        });

        test('deve adicionar anexo com sucesso', async () => {
            const result = await submissionService.addAttachment(mockSubmissionId, mockAttachmentData);

            expect(result).toBeDefined();
            expect(result.id).toBe(mockAttachmentId);
            expect(result.submission_id).toBe(mockSubmissionId);
            expect(result.filename).toBe(mockAttachmentData.filename);
            expect(result.url).toBe(mockAttachmentData.url);
            expect(result.file_type).toBe(mockAttachmentData.file_type);
            expect(result.size).toBe(mockAttachmentData.size);
            expect(result.metadata).toEqual(mockAttachmentData.metadata);

            expect(db.query).toHaveBeenCalledTimes(2);
        });

        test('deve rejeitar quando limite de anexos for atingido', async () => {
            // Simular que já atingiu o limite de anexos (5 por padrão)
            (db.query as jest.Mock).mockImplementationOnce(() => {
                return Promise.resolve({
                    rows: [{ count: '5' }] // Simula 5 anexos existentes (máximo)
                });
            });

            await expect(submissionService.addAttachment(mockSubmissionId, mockAttachmentData))
                .rejects.toThrow(/Máximo de 5 anexos permitidos/);

            // Verifica que apenas a query de contagem foi chamada
            expect(db.query).toHaveBeenCalledTimes(1);
            expect((db.query as jest.Mock).mock.calls[0][0]).toContain('SELECT COUNT(*)');
        });
    });

    describe('removeAttachment', () => {
        const mockSubmissionId = 'mock-submission-id';
        const mockAttachmentId = 'mock-attachment-id';
        const mockAttachment = {
            id: mockAttachmentId,
            submission_id: mockSubmissionId,
            filename: 'test-file.pdf',
            url: 'https://example.com/test-file.pdf',
            file_type: 'application/pdf',
            size: 1024 * 1024,
            created_at: new Date()
        };

        beforeEach(() => {
            // Reset mocks
            jest.clearAllMocks();

            // Mock database queries
            (db.query as jest.Mock).mockImplementation((query, params) => {
                if (query.includes('SELECT * FROM submission_attachments')) {
                    return Promise.resolve({
                        rows: [mockAttachment]
                    });
                } else if (query.includes('DELETE FROM submission_attachments')) {
                    return Promise.resolve({ rowCount: 1 });
                }
                return Promise.resolve({ rows: [] });
            });
        });

        test('deve remover anexo com sucesso', async () => {
            const result = await submissionService.removeAttachment(mockSubmissionId, mockAttachmentId);

            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.removedAttachment).toEqual(mockAttachment);

            expect(db.query).toHaveBeenCalledTimes(2);
            expect((db.query as jest.Mock).mock.calls[0][0]).toContain('SELECT * FROM submission_attachments');
            expect((db.query as jest.Mock).mock.calls[1][0]).toContain('DELETE FROM submission_attachments');
        });

        test('deve rejeitar quando anexo não pertence à submissão', async () => {
            // Simular que o anexo não foi encontrado
            (db.query as jest.Mock).mockImplementationOnce(() => {
                return Promise.resolve({ rows: [] });
            });

            await expect(submissionService.removeAttachment(mockSubmissionId, mockAttachmentId))
                .rejects.toThrow(/Anexo não encontrado/);

            // Verifica que apenas a query de busca foi chamada
            expect(db.query).toHaveBeenCalledTimes(1);
            expect((db.query as jest.Mock).mock.calls[0][0]).toContain('SELECT * FROM submission_attachments');
        });
    });

    describe('getSubmissionStats', () => {
        const mockSubmissionId = 'mock-submission-id';
        const mockSubmission = {
            id: mockSubmissionId,
            author_name: 'Test Author',
            author_email: 'test@example.com',
            title: 'Test Submission',
            summary: 'This is a summary that is long enough to pass validation. It needs to be at least 50 characters.',
            content: 'This is the content of the submission. It needs to be at least 100 characters long to pass validation. So I am adding more text to make sure it passes.',
            keywords: ['test', 'submission'],
            category: 'Outros',
            author_institution: 'Test Institution',
            status: constants.SUBMISSION_STATUS.DRAFT,
            created_at: new Date('2023-01-01'),
            expires_at: new Date('2023-02-01')
        };

        beforeEach(() => {
            // Reset mocks
            jest.clearAllMocks();

            // Mock database queries
            (db.query as jest.Mock).mockImplementation((query, params) => {
                if (query.includes('SELECT s.*')) {
                    return Promise.resolve({
                        rows: [{
                            ...mockSubmission,
                            version_count: '2',
                            attachment_count: '3',
                            feedback_count: '1',
                            days_since_creation: '10',
                            days_to_expiry: '20'
                        }]
                    });
                }
                return Promise.resolve({ rows: [] });
            });
        });

        test('deve retornar estatísticas da submissão', async () => {
            const result = await submissionService.getSubmissionStats(mockSubmissionId);

            expect(result).toBeDefined();
            expect(result.id).toBe(mockSubmissionId);
            expect(result.version_count).toBe('2');
            expect(result.attachment_count).toBe('3');
            expect(result.feedback_count).toBe('1');
            expect(result.days_since_creation).toBe('10');
            expect(result.days_to_expiry).toBe('20');

            // Verificar estatísticas de conteúdo
            expect(result.contentStats).toBeDefined();
            expect(result.contentStats.titleLength).toBe(mockSubmission.title.length);
            expect(result.contentStats.summaryLength).toBe(mockSubmission.summary.length);
            expect(result.contentStats.contentLength).toBe(mockSubmission.content.length);
            expect(result.contentStats.keywordCount).toBe(mockSubmission.keywords.length);
            expect(result.contentStats.hasCategory).toBe(true);
            expect(result.contentStats.hasInstitution).toBe(true);

            // Verificar completude
            expect(result.completeness).toBeDefined();
            expect(result.completeness.isComplete).toBe(true);
            expect(result.completeness.percentage).toBe(100);
            expect(result.completeness.missingFields).toHaveLength(0);

            expect(db.query).toHaveBeenCalledTimes(1);
            expect((db.query as jest.Mock).mock.calls[0][0]).toContain('SELECT s.*');
        });

        test('deve retornar null quando submissão não existe', async () => {
            // Simular que a submissão não foi encontrada
            (db.query as jest.Mock).mockImplementationOnce(() => {
                return Promise.resolve({ rows: [] });
            });

            const result = await submissionService.getSubmissionStats(mockSubmissionId);
            expect(result).toBeNull();
        });

        test('deve calcular estatísticas para submissão incompleta', async () => {
            // Simular submissão incompleta
            (db.query as jest.Mock).mockImplementationOnce(() => {
                return Promise.resolve({
                    rows: [{
                        ...mockSubmission,
                        summary: 'Too short', // Summary muito curto
                        keywords: [], // Keywords vazios
                        category: null, // Categoria ausente
                        version_count: '1',
                        attachment_count: '0',
                        feedback_count: '0',
                        days_since_creation: '5',
                        days_to_expiry: '25'
                    }]
                });
            });

            const result = await submissionService.getSubmissionStats(mockSubmissionId);

            expect(result).toBeDefined();
            expect(result.contentStats.summaryLength).toBe(9); // "Too short"
            expect(result.contentStats.keywordCount).toBe(0);
            expect(result.contentStats.hasCategory).toBe(false);

            // Verificar completude
            expect(result.completeness.isComplete).toBe(false);
            expect(result.completeness.percentage).toBeLessThan(100);
            expect(result.completeness.missingFields.length).toBeGreaterThan(0);
        });
    });

    describe('generatePreview', () => {
        const mockSubmissionId = 'mock-submission-id';
        const mockSubmission = {
            id: mockSubmissionId,
            author_name: 'Test Author',
            author_email: 'test@example.com',
            title: 'Test Submission with Special Characters: áéíóú!',
            summary: 'This is a summary of the submission.',
            content: 'This is the **content** of the submission with *markdown* formatting.\n\nIt has multiple paragraphs and line breaks.\nThis should be processed for preview.',
            keywords: ['test', 'submission', 'preview'],
            category: 'Outros',
            author_institution: 'Test Institution',
            status: constants.SUBMISSION_STATUS.DRAFT
        };

        beforeEach(() => {
            // Reset mocks
            jest.clearAllMocks();

            // Mock findById
            (db.findById as jest.Mock).mockResolvedValue(mockSubmission);

            // Mock database queries
            (db.query as jest.Mock).mockImplementation((query, params) => {
                if (query.includes('submission_attachments')) {
                    return Promise.resolve({
                        rows: [
                            {
                                filename: 'attachment1.pdf',
                                url: 'http://example.com/attachment1.pdf',
                                file_type: 'application/pdf'
                            },
                            {
                                filename: 'attachment2.jpg',
                                url: 'http://example.com/attachment2.jpg',
                                file_type: 'image/jpeg'
                            }
                        ]
                    });
                }
                return Promise.resolve({ rows: [] });
            });
        });

        test('deve gerar preview com dados formatados', async () => {
            const result = await submissionService.generatePreview(mockSubmissionId);

            expect(result).toBeDefined();
            expect(result.title).toBe(mockSubmission.title);
            expect(result.summary).toBe(mockSubmission.summary);
            expect(result.author.name).toBe(mockSubmission.author_name);
            expect(result.author.institution).toBe(mockSubmission.author_institution);
            expect(result.category).toBe(mockSubmission.category);
            expect(result.keywords).toEqual(mockSubmission.keywords);
            expect(result.attachments).toHaveLength(2);
            expect(result.previewGeneratedAt).toBeDefined();

            // Verificar slug gerado
            expect(result.slug).toBe('test-submission-with-special-characters-aeiou');

            // Verificar processamento de conteúdo
            expect(result.content).toContain('<strong>content</strong>');
            expect(result.content).toContain('<em>markdown</em>');
            expect(result.content).toContain('</p><p>');
            expect(result.content).toContain('<br>');

            expect(db.findById).toHaveBeenCalledWith('submissions', mockSubmissionId);
            expect(db.query).toHaveBeenCalledTimes(1);
        });

        test('deve rejeitar quando submissão não existe', async () => {
            // Simular que a submissão não foi encontrada
            (db.findById as jest.Mock).mockResolvedValue(null);

            await expect(submissionService.generatePreview(mockSubmissionId))
                .rejects.toThrow(/Submissão não encontrada/);
        });

        test('deve lidar com conteúdo vazio ou nulo', async () => {
            // Simular submissão com conteúdo vazio
            (db.findById as jest.Mock).mockResolvedValue({
                ...mockSubmission,
                content: null
            });

            const result = await submissionService.generatePreview(mockSubmissionId);

            expect(result).toBeDefined();
            expect(result.content).toBe('');
        });

        test('deve truncar conteúdo muito longo', async () => {
            // Criar conteúdo muito longo (mais de 2000 caracteres)
            const longContent = 'a'.repeat(3000);

            // Simular submissão com conteúdo longo
            (db.findById as jest.Mock).mockResolvedValue({
                ...mockSubmission,
                content: longContent
            });

            const result = await submissionService.generatePreview(mockSubmissionId);

            expect(result).toBeDefined();
            expect(result.content.length).toBeLessThanOrEqual(2003); // 2000 + '...'
            expect(result.content.endsWith('...')).toBe(true);
        });
    });

    describe('getSubmissionsByAuthor', () => {
        const mockAuthorEmail = 'test@example.com';
        const mockSubmissions = [
            {
                id: 'submission-1',
                title: 'Submission 1',
                status: constants.SUBMISSION_STATUS.DRAFT,
                category: 'Outros',
                created_at: new Date('2023-01-01'),
                updated_at: new Date('2023-01-02'),
                expires_at: new Date('2023-02-01'),
                feedback_count: '0'
            },
            {
                id: 'submission-2',
                title: 'Submission 2',
                status: constants.SUBMISSION_STATUS.UNDER_REVIEW,
                category: 'Tecnologia',
                created_at: new Date('2023-01-05'),
                updated_at: new Date('2023-01-06'),
                expires_at: new Date('2023-02-05'),
                feedback_count: '1'
            },
            {
                id: 'submission-3',
                title: 'Submission 3',
                status: constants.SUBMISSION_STATUS.APPROVED,
                category: 'Ciência',
                created_at: new Date('2023-01-10'),
                updated_at: new Date('2023-01-15'),
                expires_at: new Date('2023-02-10'),
                feedback_count: '2'
            }
        ];

        beforeEach(() => {
            // Reset mocks
            jest.clearAllMocks();

            // Mock database queries
            (db.query as jest.Mock).mockImplementation((query, params) => {
                if (!query.includes('SELECT id') && query.includes('SELECT COUNT(*)')) {
                    return Promise.resolve({
                        rows: [{ count: '3' }] // Total de 3 submissões
                    });
                } else if (query.includes('SELECT id')) {
                    // Simular paginação
                    const limit = params[1] || 10;
                    const offset = params[2] || 0;
                    const page = Math.floor(offset / limit) + 1;

                    // Retornar submissões paginadas
                    if (page === 1) {
                        return Promise.resolve({
                            rows: mockSubmissions.slice(0, limit)
                        });
                    } else if (page === 2 && offset === limit) {
                        return Promise.resolve({
                            rows: mockSubmissions.slice(limit, limit * 2)
                        });
                    }
                    return Promise.resolve({ rows: [] });
                }
                return Promise.resolve({ rows: [] });
            });
        });

        test('deve retornar submissões do autor com paginação padrão', async () => {
            const result: AuthorSubmissionsResult = await submissionService.getSubmissionsByAuthor(mockAuthorEmail);

            expect(result).toBeDefined();
            expect(result.submissions).toHaveLength(3);
            expect(result.submissions[0].id).toBe('submission-1');
            expect(result.submissions[1].id).toBe('submission-2');
            expect(result.submissions[2].id).toBe('submission-3');

            // Verificar informações de paginação
            expect(result.pagination).toBeDefined();
            expect(result.pagination.page).toBe(1);
            expect(result.pagination.limit).toBe(10);
            expect(result.pagination.total).toBe(3);
            expect(result.pagination.totalPages).toBe(1);
            expect(result.pagination.hasNext).toBe(false);
            expect(result.pagination.hasPrev).toBe(false);

            expect(db.query).toHaveBeenCalledTimes(2);
        });

        test('deve retornar submissões com paginação personalizada', async () => {
            // Solicitar página 2 com limite de 1 item por página
            const result: AuthorSubmissionsResult = await submissionService.getSubmissionsByAuthor(mockAuthorEmail, {
                page: 2,
                limit: 1
            });

            expect(result).toBeDefined();
            expect(result.submissions).toBeDefined();

            // Verificar informações de paginação
            expect(result.pagination).toBeDefined();
            expect(result.pagination.page).toBe(2);
            expect(result.pagination.limit).toBe(1);
            expect(result.pagination.total).toBe(3);
            expect(result.pagination.totalPages).toBe(3);
            expect(result.pagination.hasNext).toBe(true);
            expect(result.pagination.hasPrev).toBe(true);

            expect(db.query).toHaveBeenCalledTimes(2);

            // Verificar que os parâmetros de paginação foram passados corretamente
            const queryCall = (db.query as jest.Mock).mock.calls[0];
            expect(queryCall[1]).toContain(mockAuthorEmail);
            expect(queryCall[1]).toContain(1); // limit
            expect(queryCall[1]).toContain(1); // offset (page 2, limit 1)
        });

        test('deve retornar lista vazia quando não há submissões', async () => {
            // Simular que não há submissões
            (db.query as jest.Mock).mockImplementation((query) => {
                // Query de contagem total
                if (query.includes('SELECT COUNT(*) FROM submissions WHERE')) {
                    return Promise.resolve({
                        rows: [{ count: '0' }]
                    });
                }
                // Query principal de busca
                return Promise.resolve({ rows: [] });
            });

            const result: AuthorSubmissionsResult = await submissionService.getSubmissionsByAuthor(mockAuthorEmail);

            expect(result).toBeDefined();
            expect(result.submissions).toHaveLength(0);
            expect(result.pagination.total).toBe(0);
            expect(result.pagination.totalPages).toBe(0);
            expect(result.pagination.hasNext).toBe(false);
            expect(result.pagination.hasPrev).toBe(false);
        });
    });
});
