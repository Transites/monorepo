# Database Archive Documentation

## Overview

This archive contains database tables, indexes, triggers, and schema components that were **removed from the active database schema** because they are not used by the current React frontend implementation.

**Date Archived:** 2025-08-29  
**Reason:** Database cleanup to remove unused tables and components  
**Status:** All archived components are functional but not connected to current frontend

---

## What Was Archived

### Core Issue
The backend was built with comprehensive admin workflow, authentication, file upload, and communication systems. However, the **React frontend only uses 2 API endpoints**:
- `GET /api/submissions` (homepage/search)
- `GET /api/submissions/id/:id` (individual articles)

All other database tables supported unused admin features.

### Archived Components

#### 1. Schema Files (Moved Intact)
- **`admin-schema.sql`** - Complete admin review system
- **`communication-schema.sql`** - Email and notification system

#### 2. Tables (Extracted from main schema)
- **`admins`** - Admin user accounts and authentication
- **`feedback`** - Admin review feedback system  
- **`submission_versions`** - Content version history
- **`audit_logs`** - Generic audit trail
- **`submission_attachments`** - File attachment metadata
- **`file_uploads`** - Cloudinary file upload system
- **`admin_action_logs`** - Administrative action tracking  
- **`notification_settings`** - Admin notification preferences
- **`communications`** - Email communication logs
- **`notifications`** - System notifications
- **`scheduled_reminders`** - Automated reminder system

#### 3. Database Components
- **Indexes:** All indexes for archived tables → `archived-indexes.sql`
- **Triggers:** All triggers for workflow/admin features → `archived-triggers.sql`
- **Functions:** Dashboard stats, advanced search, cleanup utilities
- **Views:** Admin dashboard views, communication history
- **Enums:** `feedback_status` enum

---

## Current Active Schema

### What Remains Active
- **`submissions`** table (core data for React frontend)
- Basic indexes for performance
- Simple `updated_at` trigger
- Core extensions (`uuid-ossp`, `pg_trgm`)
- `submission_status` enum (simplified)

### Why This Works
The React frontend is a **content display application**:
- Shows published articles on homepage
- Displays individual article details
- Provides search functionality
- No admin interface, no user accounts, no file uploads

---

## Archive File Structure

```
database/archive/
├── README.md                           # This documentation
├── admin-schema.sql                   # Complete admin system (MOVED)
├── communication-schema.sql           # Email/notification system (MOVED) 
├── unused-workflow-tables.sql         # Workflow tables (EXTRACTED)
├── archived-indexes.sql               # All unused table indexes
└── archived-triggers.sql              # All unused triggers/functions
```

---

## Restoration Process

If these features need to be restored:

### 1. Quick Restoration
```bash
# Restore specific schema
psql -d database < archive/admin-schema.sql
psql -d database < archive/communication-schema.sql
psql -d database < archive/unused-workflow-tables.sql
psql -d database < archive/archived-indexes.sql
psql -d database < archive/archived-triggers.sql
```

### 2. Selective Restoration
- Individual tables can be extracted from archive files
- Restore only needed components (e.g., just admin table)
- Update foreign key references as needed

### 3. Full System Restoration  
- Restore all archive files
- Update main schema.sql to include archived tables
- Update indexes.sql and triggers.sql with archived components
- Test all admin backend routes

---

## Backend Code Status

### Still Exists But Unused
The backend still contains controllers, services, and routes for archived features:
- `/backend/controllers/auth.js` - Admin authentication
- `/backend/controllers/tokens.js` - Token management
- `/backend/services/upload.ts` - File upload system
- `/backend/services/adminReview.ts` - Review workflow

These are **marked as deprecated** and should not be used until tables are restored.

### Documentation References
- `/docs/UNFINISHED_MODULES.md` - Details of unused backend features
- `/docs/BACKEND_ROUTE_USAGE_ANALYSIS.md` - API endpoint usage analysis
- `/CLAUDE.md` - Project instructions with deprecation warnings

---

## Data Safety

### No Data Loss
- All work is preserved in git history
- Archive files contain complete table definitions
- Indexes and triggers are fully documented
- Restoration is possible at any time

### Testing
Before archiving, verified:
- ✅ React frontend continues to work
- ✅ Submissions API endpoints function normally  
- ✅ Search functionality works
- ✅ No broken references in active schema

---

## Future Considerations

### If Admin Features Are Needed
1. Restore admin-related tables from archive
2. Build React admin interface components
3. Implement authentication UI
4. Connect to existing backend admin routes

### If File Uploads Are Needed  
1. Restore file upload tables from archive
2. Build React file upload components
3. Connect to existing Cloudinary integration

### If Workflow Is Needed
1. Restore workflow tables (feedback, versions, etc.)
2. Build submission workflow UI
3. Implement token-based editing interface

---

## Archive Metadata

**Tables Archived:** 11 tables  
**Indexes Archived:** ~30 indexes  
**Triggers Archived:** ~15 triggers/functions  
**Views Archived:** 3 complex views  
**Functions Archived:** ~8 stored procedures  

**Space Saved:** Significant reduction in schema complexity  
**Performance Impact:** Minimal (unused components don't affect queries)  
**Maintenance Reduction:** Focus only on active submissions table

---

*This archive preserves months of backend development work while cleaning up the database for the current display-only React frontend. All archived components are production-ready and can be restored when needed.*