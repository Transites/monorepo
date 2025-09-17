# Dependency Injection System

This folder contains a lightweight dependency injection (DI) system for the application. The DI system helps manage dependencies between components, making the code more modular, testable, and maintainable.

## Overview

The DI system consists of three main components:

1. **Container**: A singleton class that manages the registration and resolution of dependencies.
2. **Registry**: A module that registers all application dependencies in the container.
3. **Resolver**: A function that resolves dependencies from the container.

## Usage

### Resolving Dependencies

To use a dependency in your code, import the `resolve` function and use it to get the dependency:

```typescript
import { resolve } from '../di';
import AdminReviewController from '../controllers/adminReview';

// Get the controller from the DI container
const adminReviewController = resolve<AdminReviewController>('AdminReviewController');
```

### Registering Dependencies

Dependencies are registered in the `registry.ts` file. There are three ways to register a dependency:

1. **Singleton**: The dependency is instantiated once and reused for all resolutions.
2. **Transient**: A new instance is created each time the dependency is resolved.
3. **Instance**: A pre-created instance is registered directly.

```typescript
// Register a singleton
container.registerSingleton('DatabaseClient', DatabaseClient);

// Register a transient
container.registerTransient('SomeService', SomeService);

// Register an instance
container.registerInstance('Logger', logger);
```

### Factory Functions

You can also register factory functions that create dependencies with their own dependencies:

```typescript
container.registerSingleton('AdminReviewService', () => {
  const db = container.resolve<DatabaseClient>('DatabaseClient');
  const emailService = container.resolve<any>('EmailService');
  const tokenService = container.resolve<TokenService>('TokenService');
  const logger = container.resolve<any>('Logger');
  
  return new AdminReviewService(db, emailService, tokenService, logger);
});
```

## Adding New Dependencies

To add a new dependency:

1. Import the dependency in `registry.ts`
2. Register it in the container with the appropriate lifetime
3. Update any factory functions that depend on it
4. If needed, create TypeScript definition files (.d.ts) for the dependency

### Middleware Injection

The DI system now supports middleware injection. The following middleware components are registered:

- **AuthMiddleware**: Authentication and authorization middleware
- **ErrorHandler**: Error handling middleware

These middleware components can be resolved from the DI container in your route files:

```typescript
import { resolve } from '../di';
import { AuthMiddleware } from '../middleware/auth';
import { ErrorHandler } from '../middleware/errors';

const authMiddleware = resolve<AuthMiddleware>('AuthMiddleware');
const errorHandler = resolve<ErrorHandler>('ErrorHandler');

// Use the middleware in your routes
router.use(authMiddleware.requireAuth);
router.get('/example',
    authMiddleware.logAdminAction('view_example'),
    errorHandler.asyncHandler(controller.exampleMethod)
);
```

## Benefits

Using this DI system provides several benefits:

- **Decoupling**: Components don't need to know how to create their dependencies.
- **Testability**: Dependencies can be easily mocked for testing.
- **Lifecycle Management**: The container manages the lifecycle of dependencies.
- **Centralized Configuration**: All dependencies are configured in one place.
- **Reusability**: Dependencies can be reused across the application.

## Example

Here's an example of how the DI system is used in the admin review routes:

```typescript
// Before (manual instantiation)
const db = new DatabaseClient();
const reviewService = new ReviewService(db);
const adminReviewController = new AdminReviewController(reviewService, logger, ResponseHelpers);

// After (using DI)
import { resolve } from '../di';
import AdminReviewController from '../controllers/adminReview';

const adminReviewController = resolve<AdminReviewController>('AdminReviewController');
```
