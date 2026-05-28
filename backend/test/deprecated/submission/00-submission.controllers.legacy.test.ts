import { Request, Response, NextFunction } from 'express';
import submissionController from '../../../controllers/submission';
import submissionService from '../../../services/submission';
import emailService from '../../../services/email';
import responses from '../../../utils/responses';
import { validationResult } from 'express-validator';
import untypedLogger from '../../../middleware/logging';
import { LoggerWithAudit } from "../../../types/migration";

const logger = untypedLogger as unknown as LoggerWithAudit;

// Mock dependencies
jest.mock('../../../services/submission');
jest.mock('../../../services/email');
jest.mock('../../../utils/responses');
jest.mock('../../../middleware/logging');
jest.mock('express-validator', () => ({
	validationResult: jest.fn()
}));

describe('SubmissionController', () => {
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;
	let mockNext: jest.Mock<NextFunction>;

	beforeEach(() => {
		mockRequest = {
			body: {},
			params: {},
			query: {},
			ip: '127.0.0.1'
		};
		mockResponse = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn().mockReturnThis()
		};
		mockNext = jest.fn();

		jest.clearAllMocks();

		// Mock validation result to be empty (no errors) by default
		(validationResult as unknown as jest.Mock).mockReturnValue({
			isEmpty: jest.fn().mockReturnValue(true),
			array: jest.fn().mockReturnValue([])
		});
	});

	describe('createSubmission', () => {
		const mockSubmissionData = {
			author_name: 'Test Author',
			author_email: 'test@example.com',
			title: 'Test Submission'
		};

		const mockCreatedSubmission = {
			id: 'mock-id',
			token: 'mock-token',
			title: 'Test Submission',
			status: 'DRAFT',
			author_name: 'Test Author',
			created_at: new Date(),
			expires_at: new Date()
		};

		beforeEach(() => {
			mockRequest.body = mockSubmissionData;
			(submissionService.createSubmission as jest.Mock).mockResolvedValue(mockCreatedSubmission);
		});

		test('deve retornar submissão criada com token', async () => {
			await submissionController.createSubmission(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			expect(submissionService.createSubmission).toHaveBeenCalledWith(mockSubmissionData);
			expect(responses.created).toHaveBeenCalled();
			expect(logger.audit).toHaveBeenCalled();
		});

		test('deve aplicar validações de entrada', async () => {
			// Mock validation errors
			(validationResult as unknown as jest.Mock).mockReturnValue({
				isEmpty: jest.fn().mockReturnValue(false),
				array: jest.fn().mockReturnValue([{ msg: 'Error message' }])
			});

			await submissionController.createSubmission(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			expect(submissionService.createSubmission).not.toHaveBeenCalled();
			expect(responses.badRequest).toHaveBeenCalled();
		});

		test('deve chamar next com erro em caso de falha', async () => {
			const mockError = new Error('Test error');
			(submissionService.createSubmission as jest.Mock).mockRejectedValue(mockError);

			await submissionController.createSubmission(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			expect(mockNext).toHaveBeenCalledWith(mockError);
			expect(logger.error).toHaveBeenCalled();
		});
	});

	// NOTE: arquivo completo mantido em arquivo arquivado para histórico. Outros blocos foram omitidos aqui
});
