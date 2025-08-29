# Backend Route Usage Analysis - Accurate Assessment

## Summary
After thorough analysis of the latest Vue frontend, only **2 API endpoints** were actually being used in production. The vast majority of backend routes are unused legacy code that should be marked as deprecated.

---

## ✅ ACTIVELY USED ROUTES (Keep for React Migration)

### 1. `GET /api/submissions`
**Used by**: 
- `bannerService.js` - Homepage banner carousel
- `search.js` (Vuex store) - Search functionality  
- `NavigationBar.vue` - Navigation dropdown

**Usage Pattern**:
```javascript
api.get('/submissions', {
  params: {
    top: 10-100,
    skip: 0
  }
})
```

**Expected Response**:
```typescript
{
  data: {
    submissions: Array<{
      id: string
      title: string
      category: string
      summary: string
      keywords: string[]
      author_name: string
      status: string
      metadata: {
        type: string
        image?: { url: string }
      }
    }>
  }
}
```

**Status**: ✅ **CRITICAL** - Core endpoint for homepage and search

---

### 2. `GET /api/submissions/id/:id`
**Used by**: 
- `Article.vue` - Individual article display

**Usage Pattern**:
```javascript
api.get(`/submissions/id/${id}`)
```

**Expected Response**:
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
    }
    birth?: { date: string, formatted: string }
    death?: { date: string, formatted: string }
    occupation?: string[]
    organizations?: string[]
    alternativeNames?: string[]
  }
}
```

**Status**: ✅ **CRITICAL** - Core endpoint for article viewing

---

## ❌ DEPRECATED ROUTES (Mark as Unused)

### Submission Workflow (Legacy - Never Used)
- ❌ `POST /api/submissions` - Create submission
- ❌ `GET /api/submissions/:token` - Get by token  
- ❌ `PUT /api/submissions/:token` - Update submission
- ❌ `POST /api/submissions/:token/submit` - Submit for review
- ❌ `GET /api/submissions/:token/preview` - Preview
- ❌ `GET /api/submissions/:token/stats` - Statistics
- ❌ `POST /api/submissions/:token/auto-save` - Auto-save
- ❌ `POST /api/submissions/edit` - Check in-progress articles

**Reason**: Complex submission system was built but never used in production Vue app. All submission pages existed in router but were not linked/accessible.

### File Upload System (Legacy - Never Used)
- ❌ `POST /api/upload/image`
- ❌ `POST /api/upload/document`
- ❌ `POST /api/upload/multiple`
- ❌ `DELETE /api/upload/:fileId`

**Reason**: File upload was part of unused submission workflow.

### Authentication System (Legacy - Never Used)
- ❌ `POST /api/auth/login`
- ❌ `POST /api/auth/refresh`

**Reason**: No admin interface was implemented in Vue frontend.

### Token System (Legacy - Never Used) 
- ❌ `GET /api/tokens/:token/validate`
- ❌ `POST /api/tokens/:token/verify-email`

**Reason**: Token system was part of unused submission workflow.

### Admin System (Legacy - Never Used)
- ❌ All `/api/admin/*` routes
- ❌ All `/api/admin/email/*` routes
- ❌ All `/api/admin/review/*` routes
- ❌ All `/api/admin/communications/*` routes

**Reason**: No admin interface was implemented in Vue frontend.

### Author System (Legacy - Never Used)
- ❌ `GET /api/author/submissions`

**Reason**: No author dashboard was implemented in Vue frontend.

---

## ⚠️ PHANTOM ENDPOINTS (Vue Used But Don't Exist)

These were referenced in Vue service code but don't actually exist in the current backend:

- `GET /api/categories` - Used by `submissionService.js`
- `GET /api/tags` - Used by `submissionService.js`  
- `GET /api/submissions/verbete-types` - Used by `submissionService.js`
- `GET /api/tokens/:token/status` - Used by `submissionService.js`
- `POST /api/submissions/:token/feedback/:feedbackId/read` - Used by `submissionService.js`
- `GET /api/submissions/:token/feedback` - Used by `submissionService.js`
- `GET /api/verbete-obras/:id` - Used by `WorkArticle.vue`

**Status**: These are references to old/different APIs that don't match the current backend.

---

## 🎯 React Migration Priority

### Phase 1 - Essential (Implement First)
1. `GET /api/submissions` - For homepage banner and search
2. `GET /api/submissions/id/:id` - For article display

### Phase 2 - Not Needed
Everything else can be ignored until/unless new features are built.

---

## 📝 Action Items

### For Backend Routes:
1. **Add deprecation warnings** to all unused endpoints
2. **Keep only 2 endpoints** clean and documented
3. **Add runtime deprecation headers** for unused routes

### For Controllers:
1. Mark corresponding controller methods as deprecated
2. Focus testing/maintenance only on the 2 active endpoints

### For Documentation:
1. Update all API docs to reflect actual usage
2. Remove references to unused submission/upload workflows

---

## Conclusion

The Vue frontend was essentially a **content display application** using only 2 API endpoints. The backend contains extensive submission/admin/upload functionality that was never implemented in the frontend. 

For React migration, we only need to implement:
- Homepage with submissions list/banner
- Individual article viewing
- Search functionality

All other backend routes should be marked as deprecated legacy code.