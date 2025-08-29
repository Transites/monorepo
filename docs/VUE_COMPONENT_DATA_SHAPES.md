# Vue Component Data Shapes Documentation - Cleaned for React Migration

This document outlines the data structures expected by Vue components that were **actually used** in the latest Vue frontend. After analysis, most services were legacy/unused code.

## ✅ ACTIVE COMPONENTS - Migrate to React

## Banner Component

**File**: `Banner.vue` (deleted Vue frontend)  
**Service**: `bannerService.js`  
**Endpoint**: `GET /api/submissions?top=10&skip=0`

### Expected API Response Format
```typescript
{
  data: {
    submissions: Array<{
      id: string
      title: string
      category: string
      summary: string
      metadata?: {
        image?: {
          url: string
        }
      }
    }>
  }
}
```

### Transformed Data Structure
```typescript
interface BannerItem {
  id: string           // from submission.id
  src: string          // from submission.metadata.image.url (empty if not available)
  title: string        // from submission.title
  subtitle: string     // from submission.category (or empty string)
  text: string         // from submission.summary (or empty string)
}
```

### Component Usage
- Displays items in a carousel format with navigation
- Links to `/article/person/${item.id}` 
- Shows loading state while fetching
- Auto-cycles every 3.5 seconds

**Status**: ✅ **CRITICAL** - Core homepage component, actively used

---

## Article Display Component

**File**: `Article.vue` (deleted Vue frontend)  
**Endpoint**: `GET /api/submissions/id/:id`

### Expected API Response Format
```typescript
{
  id: string
  title: string
  summary: string
  keywords: string[]
  author_name: string
  content_html: string
  metadata: {
    type: string
    image?: {
      url: string
      caption: string
      credit: string
      alternativeText: string
    }
    birth?: { 
      date: string
      formatted: string 
    }
    death?: { 
      date: string
      formatted: string 
    }
    occupation?: string[]
    organizations?: string[]
    alternativeNames?: string[]
  }
}
```

### Component Structure
- Complex metadata display (birth/death, keywords, images, etc.)
- Responsive layout with image + info sections
- HTML content rendering with DOMPurify
- Conditional rendering based on metadata availability

**Status**: ✅ **CRITICAL** - Core article viewing component, actively used

---

## Search Component

**File**: `search.js` (deleted Vue frontend Vuex store)  
**Endpoint**: `GET /api/submissions?top=100&skip=0`

### Data Processing
- Fetches all submissions for client-side search
- Implements fuzzy string matching with Levenshtein distance
- Normalizes strings (removes accents, converts to lowercase)
- Filters by title and keyword similarity

### Search Result Format
```typescript
interface SearchResult {
  id: string
  type: string              // from metadata.type
  image: string | null      // from metadata.image?.url
  title: string
  subtitle: string          // category
  tags: Array<{name: string}>  // from keywords
  status: string
  author: string            // author_name
}
```

**Status**: ✅ **ACTIVE** - Used by SearchResults.vue and NavigationBar.vue

---

## ❌ LEGACY/UNUSED SERVICES - Do NOT Migrate

### submissionService.js - LEGACY
- **Status**: ❌ **UNUSED** - Complex submission workflow never implemented in Vue UI
- **Endpoints**: All submission CRUD, auto-save, file upload endpoints
- **Reason**: Submission pages existed in router but were never accessible/linked

### personArticleService.js - REDUNDANT  
- **Status**: ❌ **REDUNDANT** - Duplicate of submissionService with same endpoint
- **Reason**: Legacy code, not used by any active components

### validationService.js - ORPHANED
- **Status**: ❌ **ORPHANED** - No components reference this service
- **Reason**: Built for unused submission forms

---

## React Migration Priorities

### Phase 1 - Essential (Implement First)
1. **Banner Component**: Homepage carousel with submissions
2. **Article Display**: Individual article viewing with rich metadata
3. **Search Functionality**: Client-side fuzzy search implementation

### Phase 2 - Not Needed
- Skip all submission/upload/admin functionality
- Skip all token-based workflows
- Skip all form validation services

## Key Data Interfaces for React

```typescript
// Core API Response
interface Submission {
  id: string
  title: string
  category: string
  summary: string
  keywords: string[]
  author_name: string
  content_html?: string  // Only in individual article view
  metadata: {
    type: string
    image?: {
      url: string
      caption?: string
      credit?: string
      alternativeText?: string
    }
    birth?: { date: string; formatted: string }
    death?: { date: string; formatted: string }
    occupation?: string[]
    organizations?: string[]
    alternativeNames?: string[]
  }
}

// Submissions List Response
interface SubmissionsResponse {
  data: {
    submissions: Submission[]
  }
}
```

This cleaned documentation focuses only on the components and data that were actively used in the Vue frontend, removing all legacy/unused services that should not be migrated to React.