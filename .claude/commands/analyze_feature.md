# Analyze Feature

Analyze how a specific feature works in the Transitos codebase, tracing data flow from frontend to backend and documenting the implementation.

## Process

1. **Define the Feature Scope**:
   - What specific functionality are you analyzing?
   - Is it frontend-only, backend-only, or full-stack?
   - What user workflow does it support?

2. **Frontend Analysis** (if applicable):
   ```
   - Check `/react-frontend/src/pages/` for page components
   - Check `/react-frontend/src/components/` for UI components  
   - Check `/react-frontend/src/hooks/` for custom hooks
   - Check `/react-frontend/src/lib/api.ts` for API calls
   - Look for TypeScript interfaces in `/react-frontend/src/types/`
   ```

3. **Backend Analysis** (if applicable):
   ```
   - Check `/backend/routes/` for API endpoints
   - Check `/backend/controllers/` for request handling
   - Check `/backend/services/` for business logic
   - Check `/backend/database/schema.sql` for data models
   - Look for validation in `/backend/validators/`
   ```

4. **Data Flow Tracing**:
   - Start from user interaction (frontend)
   - Follow API calls to backend routes
   - Trace through middleware, controllers, services
   - Document database operations
   - Note response transformation back to frontend

## Research Strategy

Use Task tool with general-purpose agent to:
- Find all files related to the feature
- Understand the implementation patterns
- Identify key integration points
- Document the current architecture

## Output Format

Create comprehensive analysis:

```markdown
# [Feature Name] Analysis

## Overview
[Brief description of what the feature does]

## Architecture

### Frontend Components
- **Page**: `react-frontend/src/pages/[Component].tsx:line` - [purpose]
- **UI Components**: `react-frontend/src/components/[Component].tsx:line` - [purpose]
- **Hooks**: `react-frontend/src/hooks/[hook].ts:line` - [purpose]

### Backend Implementation
- **Route**: `backend/routes/[route].ts:line` - [endpoint definition]
- **Controller**: `backend/controllers/[controller].ts:line` - [request handling]
- **Service**: `backend/services/[service].ts:line` - [business logic]

### Database
- **Tables**: [table_name] - [purpose and key fields]
- **Queries**: [description of main queries used]

## Data Flow
1. User action: [description]
2. Frontend: [component] → [api call]
3. Backend: [route] → [controller] → [service]
4. Database: [operation]
5. Response: [data transformation and return path]

## Key Dependencies
- External services: [list]
- Third-party libraries: [list] 
- Internal modules: [list]

## Integration Points
- [How this feature connects to other features]
- [Shared utilities or services used]

## Potential Issues
- [Known limitations or edge cases]
- [Performance considerations]
- [Security considerations]
```

## Use Cases

- Understanding existing features before modification
- Onboarding new developers
- Documenting complex workflows
- Preparing for refactoring
- Troubleshooting issues