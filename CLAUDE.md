# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development flow
1. Research, plan, and development.
2. Always write documents on the `/docs/` folder when doing any change.
3. Run /context to check how much context you have used. If it is above 40% of the window, stop, summarize your work in a
   document, and warn the user that the SESSION MUST BE RESTARTED DUE TO CONTEXT LIMITS.
4. Unless a command prompt says otherwise, when searching for stuff, spawn sub-agents to do the job and get back the exact info for you.

## Project Overview

This is a monorepo for the Transitos project - an academic submission and encyclopedia management system developed for
IEA-USP. It consists of a React frontend and a Node.js/Express backend with PostgreSQL database.

## Architecture

### Backend (`/backend`)

- **Express.js** server with TypeScript
- **PostgreSQL** database with migration system
- **Trusted origin authentication** for development
- **File uploads** via Cloudinary and Multer
- **Email notifications** via Resend service
- **Automated jobs** for token cleanup and email notifications

Key services:

- `AdminReviewService`: Handles article review workflow
- `SubmissionService`: Manages article submissions
- `EmailService`: Email template and notification handling
- `UploadService`: File upload and media management

### React Frontend (`/react-frontend`)

- **React 18** with functional components and hooks
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **React Router** for navigation
- **TanStack Query** for server state management
- **React Hook Form** with Zod validation
- **Vite** for build tooling

Key features:

- Responsive design with mobile-first approach
- Modern component architecture with TypeScript interfaces
- Optimized bundle with tree-shaking
- Comprehensive UI component library

## Development Commands

### Backend

```bash
# Development
npm run dev              # Start with nodemon + ts-node
npm run build           # Compile TypeScript
npm run start           # Start production server

# Testing  
npm run test            # Unit tests (excludes integration)
npm run test:integration # Integration tests only
npm run test:coverage   # Test coverage report
npm run test:watch      # Watch mode

# Database
npm run seed:admin      # Seed admin data

# Code Quality
npm run lint            # ESLint check
npm run lint:fix        # ESLint fix
```

### React Frontend

```bash
# Development
npm run dev             # Vite dev server with hot reload
npm run build           # Production build
npm run build:dev       # Development build
npm run preview         # Preview build

# Code Quality  
npm run lint            # ESLint
```

### Root Level

```bash
# Docker
docker-compose up       # Start both frontend and backend
docker-compose down     # Stop services
```

## Database Schema

The database uses PostgreSQL with the following main tables:

- `submissions`: Article submissions with workflow state
- `users`: User accounts and authentication
- `tokens`: JWT token management
- `admin_reviews`: Review workflow tracking
- `communication`: Email communication logs

Migration files are in `/backend/database/migrations/` and run automatically on startup.

## Authentication System

The app uses a trusted origin authentication approach:

1. **Trusted Origins**: Requests from localhost:8080 and enciclopedia.iea.usp.br bypass authentication
2. **Development Mode**: Local development runs with trusted origin privileges

## File Structure

```
monorepo/
├── backend/               # Express.js API server
│   ├── controllers/       # Route handlers
│   ├── services/         # Business logic
│   ├── middleware/       # Express middleware
│   ├── routes/           # API route definitions
│   ├── database/         # Schema, migrations, seeds
│   ├── types/           # TypeScript definitions
│   ├── utils/           # Shared utilities
│   └── test/            # Test files
├── react-frontend/       # React application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Utilities and helpers
│   │   └── types/       # TypeScript definitions
│   └── public/          # Static assets
└── docker-compose.yml   # Development environment
```

## Environment Variables

### Backend

- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Environment (development/production)
- `CLOUDINARY_*`: Cloudinary configuration for file uploads
- `RESEND_API_KEY`: Email service API key

### React Frontend

- `VITE_CONTRIBUTE_EMAIL`: Contact email for contributions

## Testing

The backend has comprehensive test coverage:

- Unit tests for services, controllers, middleware
- Integration tests for API endpoints
- Database tests for migrations and schema
- Test fixtures for file uploads

The React frontend uses modern development tooling with TypeScript for type safety and Tailwind for responsive design.

## Deployment

The project is configured for deployment via Docker containers.

## Specific Instructions

### Code Style

- **Comments**: When writing comments, explain WHY, never HOW
- **TypeScript**: Use strict typing, avoid `any` type unless absolutely necessary
- **Components**: Prefer functional components with hooks over class components
- **Naming**: Use descriptive names that convey intent and business meaning

### React Best Practices

- Use React Hook Form with Zod for form validation
- Implement proper error boundaries for error handling
- Use TanStack Query for server state management
- Follow shadcn/ui patterns for consistent component styling
- Implement proper TypeScript interfaces for all data structures

## ⚠️ CRITICAL: Deprecated Backend Code

**DO NOT use, modify, or rely on any deprecated backend routes, controllers, or services** unless specifically
instructed. These systems are marked with `@deprecated` and should be treated as invisible:

- Authentication system (`/api/auth/*`)
- File upload system (`/api/upload/*`)
- Admin interface (`/api/admin/*`)
- Token management (`/api/tokens/*`)
- Author dashboard (`/api/author/*`)
- Submission workflow (token-based endpoints)

These exist in the codebase but are **not connected to the React frontend**. See `/docs/UNFINISHED_MODULES.md` for
details.

### API Integration Rules

- **Only use these endpoints**: `GET /api/submissions` and `GET /api/submissions/id/:id`
- All API calls should handle loading and error states
- Use proper TypeScript interfaces for API responses
- **Never call deprecated endpoints** - they should be invisible to React development

### Documentation

- All project documentation is in `/docs/` folder
- Reference `/docs/BACKEND_ROUTE_USAGE_ANALYSIS.md` for API endpoint status
- See `/docs/VUE_COMPONENT_DATA_SHAPES.md` for API data structure examples
- Check `/docs/UNFINISHED_MODULES.md` for unused backend features

## Important Development Reminders

### Critical Rules

- **NEVER modify deprecated backend code** - it should be invisible
- **ONLY use active API endpoints** listed above
- **Focus React development** on content display features
- **Do not implement** authentication, file uploads, or admin features

### Development Approach

- Do what has been asked; nothing more, nothing less
- Prefer editing an existing file to creating a new one, as the codebase may already have what's about to be done. So,
  search for it first. If creating a new file, ensure it is necessary and ask for permission first.
- Follow the existing React component patterns
- Use TypeScript for all new code in the frontend