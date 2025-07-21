/**
 * Dependency Registry
 *
 * This file registers all dependencies in the container.
 * It serves as a central place to configure the application's dependencies.
 */

import { Container } from './container';
import AdminReviewService from '../services/adminReview';
import AdminReviewController from '../controllers/adminReview';
import logger from '../middleware/logging';
import ResponseHelpers from '../utils/responses';
import { TokenService } from '../services/tokens';

// For CommonJS modules that don't support ES imports
const EmailService = require('../services/email');
const authMiddleware = require('../middleware/auth');
const errorHandler = require('../middleware/errors');

// Get the container instance
const container = Container.getInstance();

/**
 * Register all dependencies
 */
export function registerDependencies(): void {
	// Register core services as singletons

	container.registerInstance('Logger', logger);
	container.registerInstance('ResponseHelpers', ResponseHelpers);

	// CommonJS modules
	container.registerSingleton('EmailService', () => EmailService);
	container.registerSingleton('TokenService', TokenService);

	// Register middleware
	container.registerInstance('AuthMiddleware', authMiddleware);
	container.registerInstance('ErrorHandler', errorHandler);

	// Register admin review service with its dependencies
	container.registerSingleton('AdminReviewService', () => {
		const db = require('../database/client');
		const emailService = container.resolve<any>('EmailService');
		const logger = container.resolve<any>('Logger');

		return new AdminReviewService(db, emailService, logger);
	});

	// Register admin review controller with its dependencies
	container.registerSingleton('AdminReviewController', () => {
		const adminReviewService = container.resolve<AdminReviewService>('AdminReviewService');
		const logger = container.resolve<any>('Logger');
		const responseHelpers = container.resolve<any>('ResponseHelpers');

		return new AdminReviewController(adminReviewService, logger, responseHelpers);
	});
}

/**
 * Get a registered dependency from the container
 * @param token The token of the dependency to resolve
 * @returns The resolved dependency
 */
export function resolve<T>(token: string): T {
	return container.resolve<T>(token);
}

// Initialize the registry
registerDependencies();
