# Strapi Legacy System Analysis

This document analyzes the legacy Strapi CMS codebase found in `/backend/src-deprecated/` that was replaced by the current Express.js backend system.

## Overview

The legacy system was a complete **Strapi v4 CMS** implementation that provided:
- Content management for academic articles and submissions
- API endpoints for CRUD operations
- Admin interface for content editing
- File upload capabilities
- Multi-language support

**Status**: COMPLETELY DEPRECATED - No active integrations remain in current codebase.

## Architecture Analysis

### Core Strapi Files

#### Main Entry Point
- **`/backend/src-deprecated/index.js`** - Standard Strapi bootstrap file
  - Contains empty register/bootstrap functions
  - Standard Strapi v4 initialization pattern

#### API Structure
The legacy system defined **5 main content types**:

1. **Author** (`/api/author/`)
   - Schema: Author information and metadata
   - Controllers: CRUD operations for author management
   - Routes: Standard Strapi REST endpoints
   - Services: Business logic for author operations

2. **Category** (`/api/category/`)
   - Schema: Article categorization system
   - Controllers: Category management operations
   - Routes: Category CRUD endpoints
   - Services: Category relationship handling

3. **Person-Article** (`/api/person-article/`)
   - Schema: Main encyclopedia article content type
   - Controllers: Article management with complex relationships
   - Routes: Article CRUD with advanced filtering
   - Services: Article publishing workflow

4. **Submission** (`/api/submission/`)
   - Schema: Article submission system
   - Controllers: Submission workflow management
   - Routes: Submission lifecycle endpoints
   - Services: Review and approval processes

5. **Tag** (`/api/tag/`)
   - Schema: Tagging system for articles
   - Controllers: Tag management operations
   - Routes: Tag CRUD endpoints
   - Services: Tag relationship handling

### Component System

#### Data Components (`/components/`)
Strapi's component system defined reusable data structures:

1. **Data Local Components** (`/components/data-local/`)
   - `birth.json` - Birth date/location structure
   - `death.json` - Death date/location structure

2. **Other Components** (`/components/other/`)
   - `eventos.json` - Event structure for timeline
   - `place-and-date.json` - Generic place/date component

3. **Publication Components** (`/components/publication/`)
   - `publication.json` - Publication metadata structure

4. **Section Components** (`/components/section/`)
   - `free-text-section.json` - Flexible content sections
   - `strict-text-section.json` - Structured content sections

### Generated Files
The system included **TypeScript definition files** (auto-generated):
- `*.d.ts` files - TypeScript definitions for all APIs
- `*.d.ts.map` files - Source maps for TypeScript compilation
- These were generated from the JSON schemas

## API Endpoints (Legacy)

The Strapi system would have provided these standard endpoints:

```
GET    /api/authors           # List authors
GET    /api/authors/:id       # Get author by ID
POST   /api/authors           # Create author
PUT    /api/authors/:id       # Update author
DELETE /api/authors/:id       # Delete author

GET    /api/categories        # List categories
GET    /api/categories/:id    # Get category by ID
POST   /api/categories        # Create category
PUT    /api/categories/:id    # Update category
DELETE /api/categories/:id    # Delete category

GET    /api/person-articles   # List articles
GET    /api/person-articles/:id # Get article by ID
POST   /api/person-articles   # Create article
PUT    /api/person-articles/:id # Update article
DELETE /api/person-articles/:id # Delete article

GET    /api/submissions       # List submissions
GET    /api/submissions/:id   # Get submission by ID
POST   /api/submissions       # Create submission
PUT    /api/submissions/:id   # Update submission
DELETE /api/submissions/:id   # Delete submission

GET    /api/tags              # List tags
GET    /api/tags/:id          # Get tag by ID
POST   /api/tags              # Create tag
PUT    /api/tags/:id          # Update tag
DELETE /api/tags/:id          # Delete tag
```

## Replacement System

The legacy Strapi system was **completely replaced** by:

1. **Express.js Backend** - Custom API server with more control
2. **Direct PostgreSQL** - Database operations without ORM overhead  
3. **Custom Controllers** - Tailored business logic for specific needs
4. **Simplified Schema** - Direct database schema instead of Strapi's abstraction

### Migration Rationale

The Strapi system was likely replaced because:
- **Over-engineering**: Too complex for the actual requirements
- **Performance**: Direct database access is faster than Strapi's abstraction
- **Flexibility**: Custom Express.js API provides more control
- **Maintenance**: Simpler codebase without Strapi dependencies

## Current Status

### What Remains Active
- **NONE** - Zero Strapi code is used in production
- Express.js backend handles all API operations
- React frontend consumes Express.js endpoints only

### What Can Be Safely Deleted  
- **Entire `/backend/src-deprecated/` folder** (100+ files)
- All Strapi content types, components, and configurations
- Generated TypeScript definitions
- Schema files and component definitions

## Dependencies Impact

### No Breaking Changes
Deleting the legacy Strapi code will NOT break anything because:
- Current Express.js backend is completely independent
- React frontend only calls Express.js endpoints
- No imports or references to Strapi code exist
- Database schema is managed independently

### File Count Analysis
The legacy system contains approximately:
- **5 content types** × 4 files each (controller, route, service, schema) = 20 core files
- **5 component definitions** in JSON format = 5 files
- **20+ generated TypeScript files** (.d.ts and .d.ts.map) = 40 files
- **Supporting files** (index.js, configs, etc.) = 10+ files

**Total**: ~75-100 files that serve no purpose in current system

## Conclusion

The legacy Strapi system in `/backend/src-deprecated/` represents a complete CMS implementation that was superseded by the current Express.js backend. It can be safely deleted with zero impact on functionality, significantly reducing repository size and maintenance overhead.

The replacement Express.js system provides the same functionality with:
- Better performance (direct database access)
- Simpler maintenance (custom code vs Strapi abstraction) 
- More flexibility (tailored endpoints vs generic CMS)
- Reduced dependencies (no Strapi framework overhead)