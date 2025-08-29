# Comprehensive Deletion Plan

This document outlines the complete removal of obsolete code from the Transitos monorepo, including Vue.js frontend, legacy Strapi CMS, Render deployment configuration, and associated references.

## Executive Summary

**Objective**: Clean up repository by removing ~1000+ obsolete files
**Impact**: Zero functional impact - all deleted systems are unused
**Benefit**: Cleaner codebase, reduced maintenance, eliminated confusion

## Systems to be Deleted

### 1. Vue.js Frontend (`/frontend/` folder)
**Status**: Complete application, not used by current system  
**Size**: 500+ files  
**Dependencies**: 50+ npm packages  

#### Key Components Being Deleted:
- **Main Application**: Vue 3 + Composition API
- **UI Framework**: Vuetify components and theming
- **State Management**: Vuex store with modules
- **Internationalization**: Vue i18n with translations
- **Rich Text Editor**: TipTap integration
- **Testing Suite**: Vitest with component tests
- **Build System**: Vite configuration

#### Critical Files/Folders:
```
/frontend/
├── src/
│   ├── components/           # 20+ Vue components
│   ├── views/               # 10+ page components  
│   ├── services/            # API client services
│   ├── store/               # Vuex state management
│   ├── i18n/                # Internationalization
│   └── tests/               # Component tests
├── public/                  # Static assets
├── node_modules/            # Dependencies (largest folder)
├── package.json             # 50+ dependencies
├── vite.config.mjs         # Build configuration
└── README.md               # Documentation
```

### 2. Legacy Strapi CMS (`/backend/src-deprecated/` folder)
**Status**: Complete CMS system, replaced by Express.js  
**Size**: 100+ files  
**Dependencies**: Part of backend package.json (unused)

#### Key Components Being Deleted:
- **5 Content Types**: Author, Category, Person-Article, Submission, Tag
- **Component System**: Reusable data structures
- **Generated Files**: TypeScript definitions and maps
- **API Structure**: Controllers, routes, services for each content type

#### Critical Files/Folders:
```
/backend/src-deprecated/
├── api/                     # 5 content types × 4 files each
│   ├── author/             # Author content type
│   ├── category/           # Category content type  
│   ├── person-article/     # Main article content type
│   ├── submission/         # Submission workflow
│   └── tag/                # Tagging system
├── components/             # 5+ reusable components
│   ├── data-local/         # Birth/death components
│   ├── other/              # Event components
│   ├── publication/        # Publication metadata
│   └── section/            # Content sections
├── extensions/             # (empty)
├── utils/                  # (empty)
├── validators/             # (empty)  
└── index.js               # Bootstrap file
```

### 3. Render Deployment Configuration
**Status**: Configured for Strapi deployment, not current system  
**Size**: 1 file + references  
**Impact**: Remove deployment capability for obsolete system

#### Files Being Deleted:
- `/render.yaml` - Complete deployment configuration for Strapi
  - Database connections
  - Environment variables  
  - Build/start commands
  - Health check endpoints

### 4. Testing Scripts and Utilities
**Status**: Development utilities for obsolete systems  
**Size**: Small scripts  
**Purpose**: Testing endpoints that don't exist

#### Files Being Deleted:
- `/test-submissions-endpoint.js` - Test script for old API

## Documentation Updates Required

### 1. Update `/CLAUDE.md`
**Current Issues**: May contain outdated Strapi references  
**Action**: Remove any remaining Strapi system descriptions

### 2. Update `/README.md`  
**Current Issues**: Likely contains Vue frontend and Render deployment instructions  
**Action**: Remove obsolete setup instructions and architectural references

### 3. Update Package Dependencies
**Current Issues**: Unused dependencies in package.json files  
**Action**: Clean up any dependencies only used by deleted systems

## Step-by-Step Deletion Process

### Phase 1: Backup (Optional)
- [ ] Create branch for deletion work
- [ ] Verify current system functionality  
- [ ] Document current working state

### Phase 2: File System Cleanup
- [ ] Delete `/frontend/` folder (Vue.js application)
- [ ] Delete `/backend/src-deprecated/` folder (Strapi CMS)
- [ ] Delete `/render.yaml` (deployment configuration)
- [ ] Delete `/test-submissions-endpoint.js` (test script)

### Phase 3: Documentation Updates
- [ ] Update `/CLAUDE.md` - remove Strapi references
- [ ] Update `/README.md` - remove Vue/Render references  
- [ ] Update any other docs with outdated references

### Phase 4: Verification
- [ ] Verify React frontend still works
- [ ] Verify Express.js backend still works
- [ ] Verify no broken imports or references
- [ ] Run tests to ensure functionality

## Safety Validation

### Zero Impact Verification

#### Current Active Systems:
✅ **React Frontend** (`/react-frontend/`) - ACTIVE, will not be touched  
✅ **Express.js Backend** (`/backend/` - non-deprecated) - ACTIVE, will not be touched  
✅ **PostgreSQL Database** - ACTIVE, schema independent of deleted code  

#### Deleted Systems Usage Check:
❌ **Vue Frontend** - No references in active code  
❌ **Strapi CMS** - No imports or API calls from current system  
❌ **Render Deployment** - Not used for current hosting setup  

### Dependency Analysis

#### Frontend Dependencies:
- React frontend has its own `package.json` - independent
- Vue frontend has separate `package.json` - will be deleted with folder

#### Backend Dependencies:
- Express.js backend continues using existing `package.json`
- Strapi dependencies may be unused but won't break existing functionality

## Expected Outcomes

### Repository Size Reduction
- **Before**: ~1000+ files across obsolete systems
- **After**: Clean repository with only active code
- **Benefit**: Faster clones, clearer structure

### Developer Experience Improvement  
- **Before**: Confusion between Vue and React frontends
- **After**: Clear single frontend system
- **Benefit**: New developers won't get confused by obsolete code

### Maintenance Reduction
- **Before**: Multiple systems to understand and potentially maintain
- **After**: Focus only on active React + Express.js systems
- **Benefit**: Reduced cognitive load and maintenance overhead

## Rollback Plan

In the unlikely event of issues:
1. **Git History**: All deleted files remain in git history
2. **Branch Recovery**: Deletion work done in branch, can revert
3. **Selective Recovery**: Can restore individual files if needed

## File Count Summary

| System | Files | Folders | Size Impact |
|--------|-------|---------|-------------|
| Vue Frontend | ~500 | ~50 | Large (node_modules) |
| Strapi Legacy | ~100 | ~20 | Medium |  
| Render Config | 1 | 0 | Small |
| Test Scripts | 1-2 | 0 | Small |
| **TOTAL** | **~600** | **~70** | **Large** |

## Approval Checklist

Before proceeding with deletions:
- [ ] Verify current React frontend functionality  
- [ ] Verify current Express.js backend functionality
- [ ] Confirm no active development on deleted systems
- [ ] Backup/branch created for safety
- [ ] Team aware of cleanup process

## Post-Deletion Tasks

After successful deletion:
- [ ] Update project documentation
- [ ] Clean up any remaining unused dependencies
- [ ] Update development setup instructions
- [ ] Communicate changes to team members