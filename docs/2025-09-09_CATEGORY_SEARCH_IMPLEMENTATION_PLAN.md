# Category-Based Search Implementation Plan

**Date:** 2025-09-09  
**Task:** Implement category-based search functionality with homepage integration  
**Status:** 📋 PLANNED - Ready for implementation  

## 🎯 Overview

Implement category-based search functionality that allows users to search submissions by category. This involves making homepage category components clickable to initiate category searches, adding backend API support for category filtering, and enhancing the search component with category selection capabilities.

## 📊 Current State Analysis

### 🔍 Key Discoveries:

#### Category System Architecture:
- **Frontend Categories**: 7 content-type categories (pessoa, obra, evento, instituições, empresas, agrupamentos, conceitos)
  - File: `react-frontend/src/lib/categoryColors.ts:1-41`
  - Color-coded with CSS custom properties and internationalization support
  - Used in CategoriesSection.tsx for homepage display

- **Backend Categories**: 11 academic discipline categories (História, Filosofia, Literatura, Arte, etc.)
  - File: `backend/utils/constants.js` 
  - Used for backend validation but conflicts with actual data

- **Database Reality**: Mixed category values - contains both frontend categories ("pessoa", "obra") and backend categories ("História", "Filosofia")
  - Schema: `category VARCHAR(100)` with index `idx_submissions_category`
  - Actual published submissions use frontend category system

#### Current Search Implementation:
- **Embedded in homepage**: Search exists in HeroSection.tsx, not a dedicated page
- **No URL routing**: Search state not preserved in URLs (/search routes don't exist)
- **API endpoints**: `/api/submissions` and `/api/submissions/search-fuzzy` exist but don't support category filtering
- **No category integration**: CategoriesSection.tsx components have no click handlers

#### Backend API Support:
- **Infrastructure ready**: Database has category index and admin system already uses category filtering
- **Query patterns exist**: Admin queries use `category = ANY($n::text[])` pattern
- **Minimal changes needed**: Just need to add category parameter to public API endpoints

## 🚀 Desired End State

### 🔍 User Experience:
1. **Homepage categories clickable** - Users can click category cards to search by that category
2. **Search with category filter** - Search component shows category selection before user types
3. **Category-specific results** - Backend filters submissions by selected category
4. **Single category selection** - Users can select one category at a time (no complex queries)
5. **Text search override** - Typing removes category filter (noted in code comments)

### ✅ Verification Criteria:
- Category cards on homepage navigate to search with pre-selected category
- Search component displays available categories for selection
- Backend API returns category-filtered results
- URL structure supports category search (e.g., `/?category=pessoa&search=true`)
- Category filter is removed when user starts typing text search

## ❌ What We're NOT Doing

- Creating dedicated `/search` route pages (maintaining embedded search approach)
- Supporting multiple category selection (complex queries not supported yet)
- Combining text search with category filtering (either/or approach)
- Modifying the core database schema or migration system
- Resolving the backend/frontend category system mismatch (addressing in future)

## 🛠️ Implementation Approach

**Strategy**: Extend existing embedded search system with category support while maintaining current UX patterns. Resolve category system inconsistency by adopting frontend categories as the primary system.

---

## Phase 1: 🔧 Backend API Category Support

### 🎯 Overview
Add category filtering support to existing submissions API endpoints without breaking current functionality.

### 🔧 Changes Required:

#### 1. Update Submissions Controller
**File**: `backend/controllers/submission.ts`
**Changes**: Add category parameter support to both search endpoints

**Lines 505-523** (Regular submissions endpoint):
```typescript
// Add category parameter extraction
const { search, requestedState, top = 10, skip = 0, category } = req.query;

// Add category validation
if (category && !isValidCategory(category as string)) {
    return res.status(400).json({ error: 'Invalid category' });
}

// Pass category to service
const result = await SubmissionService.getSubmissions({
    search: search as string,
    requestedState: (requestedState as string) || 'PUBLISHED',
    top: parseInt(top as string),
    skip: parseInt(skip as string),
    category: category as string // New parameter
});
```

**Lines 432-495** (Fuzzy search endpoint):
```typescript
// Add category parameter to fuzzy search
const { search, threshold = 0.15, top = 10, skip = 0, category } = req.query;

// Add category validation
if (category && !isValidCategory(category as string)) {
    return res.status(400).json({ error: 'Invalid category' });
}

// Pass to fuzzy search service
const results = await SubmissionService.fuzzySearchSubmissions(
    search as string,
    parseFloat(threshold as string),
    parseInt(top as string),
    parseInt(skip as string),
    category as string // New parameter
);
```

#### 2. Update Submission Service
**File**: `backend/services/submission.ts`
**Changes**: Modify SQL queries to include category filtering

**Lines 1275-1335** (getSubmissions method):
```typescript
// Update method signature
async getSubmissions({ search, requestedState, top, skip, category }: {
    search?: string;
    requestedState: string;
    top: number;
    skip: number;
    category?: string; // New parameter
}) {
    // Update SQL query to include category filtering
    let query = `
        SELECT id, title, summary, status, category, author_name, author_email,
               created_at, updated_at, expires_at, metadata, keywords,
               (SELECT COUNT(*) FROM feedback WHERE submission_id = s.id) as feedback_count
        FROM submissions s
        WHERE 1 = 1
    `;
    
    const params: any[] = [];
    let paramIndex = 1;
    
    // Add category filter if provided
    if (category) {
        query += ` AND category = $${paramIndex}`;
        params.push(category);
        paramIndex++;
    }
    
    // Rest of existing query logic...
}
```

**Lines 1085-1239** (fuzzySearchSubmissions method):
```typescript
// Update method signature
async fuzzySearchSubmissions(
    searchTerm: string, 
    threshold: number, 
    top: number, 
    skip: number,
    category?: string // New parameter
) {
    // Update both exact and fuzzy search queries to include category filtering
    // Add category condition to both exactSearchQuery and fuzzySearchQuery
    
    if (category) {
        exactSearchQuery += ` AND s.category = $${nextParamIndex}`;
        fuzzySearchQuery += ` AND s.category = $${nextParamIndex}`;
        params.push(category);
        nextParamIndex++;
    }
    
    // Rest of existing logic...
}
```

#### 3. Add Category Validation Helper
**File**: `backend/controllers/submission.ts`
**Changes**: Add validation function for frontend categories

```typescript
// Add at top of file
const FRONTEND_CATEGORIES = [
    'pessoa', 'obra', 'evento', 'instituicoes', 
    'empresas', 'agrupamentos', 'conceitos'
];

function isValidCategory(category: string): boolean {
    return FRONTEND_CATEGORIES.includes(category.toLowerCase());
}
```

### ✅ Success Criteria:

#### 🤖 Automated Verification:
- [ ] Backend builds successfully: `cd backend && npm run build`
- [ ] Backend unit tests pass: `cd backend && npm test`
- [ ] Backend integration tests pass: `cd backend && npm run test:integration`
- [ ] Backend linting passes: `cd backend && npm run lint`
- [ ] API returns category-filtered results: `curl "localhost:1337/api/submissions?category=pessoa"`
- [ ] API validates invalid categories: `curl "localhost:1337/api/submissions?category=invalid" | grep "Invalid category"`

#### 👨‍💻 Manual Verification:
- [ ] `/api/submissions?category=pessoa` returns only pessoa submissions
- [ ] `/api/submissions/search-fuzzy?search=test&category=obra` filters fuzzy results by categoria
- [ ] Invalid category values return 400 error with helpful message
- [ ] Existing functionality without category parameter works unchanged

---

## Phase 2: 📱 Frontend Search Component Enhancement

### 🎯 Overview
Enhance the search component to support category selection before text input, with category filter removal when user types.

### 🔧 Changes Required:

#### 1. Update Search Hook
**File**: `react-frontend/src/hooks/use-search.ts`
**Changes**: Add category state and API integration

```typescript
// Add to interface
interface UseSearchOptions {
  debounceMs?: number;
  category?: string; // New option
}

// Add category state
const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

// Update search function to include category
const performSearch = useCallback(async (query: string, category?: string) => {
    if (!query.trim() && !category) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
        // If category is provided, use regular search with category filter
        // If text query is provided, use fuzzy search (removes category)
        const results = category && !query.trim() 
            ? await searchSubmissions('', { 
                requestedState: 'PUBLISHED',
                category: category,
                top: 10 
              })
            : await searchSubmissionsFuzzy(query, {
                threshold: 0.15,
                top: 10,
                // Note: Category filtering removed when user types (no complex queries supported)
              });
        
        setResults(results);
        setHasSearched(true);
    } catch (err) {
        setError('Search failed. Please try again.');
        console.error('Search error:', err);
    } finally {
        setIsLoading(false);
    }
}, []);

// Return category state and controls
return {
    // ... existing returns
    selectedCategory,
    setSelectedCategory,
    clearCategory: () => setSelectedCategory(null)
};
```

#### 2. Update API Client
**File**: `react-frontend/src/lib/api.ts`
**Changes**: Add category parameter to API functions

```typescript
// Update searchSubmissions function
export const searchSubmissions = async (
  query: string,
  options: {
    requestedState?: 'DRAFT' | 'READY' | 'PUBLISHED' | 'BOTH';
    top?: number;
    skip?: number;
    category?: string; // New parameter
  } = {}
): Promise<Submission[]> => {
  const params = new URLSearchParams();
  
  if (query) params.append('search', query);
  if (options.requestedState) params.append('requestedState', options.requestedState);
  if (options.top) params.append('top', options.top.toString());
  if (options.skip) params.append('skip', options.skip.toString());
  if (options.category) params.append('category', options.category); // New parameter
  
  // Rest of existing logic...
};

// Add category parameter to fuzzy search as well (future-proofing)
export const searchSubmissionsFuzzy = async (
  query: string,
  options: {
    threshold?: number;
    top?: number;
    skip?: number;
    category?: string; // New parameter for future use
  } = {}
): Promise<Submission[]> => {
  // Existing implementation (category not used initially per requirements)
};
```

#### 3. Update HeroSection Component
**File**: `react-frontend/src/components/HeroSection.tsx`
**Changes**: Add category selection UI above search input

```typescript
// Add category imports
import { CATEGORIES_CONFIG } from '../lib/categoryColors';

// Update component to show category selection
const HeroSection: React.FC = () => {
  const { 
    query, results, isLoading, error, hasSearched,
    selectedCategory, setSelectedCategory, clearCategory,
    handleSearch, clearSearch 
  } = useSearch();
  
  // Add category selection handler
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    // Clear text input when selecting category
    setQuery(''); 
    // Trigger search immediately
    handleSearch('', category);
  };
  
  // Add text input handler that clears category
  const handleTextInput = (value: string) => {
    if (selectedCategory && value.trim()) {
      // Note: Removing category filter - complex queries not supported yet
      clearCategory();
    }
    setQuery(value);
  };

  return (
    <section className="relative bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen flex items-center">
      {/* Existing hero content */}
      
      {/* Category Selection (shown when no text input) */}
      {!query && !hasSearched && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            {t('search.categoryPrompt')} {/* "Browse by category or search below" */}
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(CATEGORIES_CONFIG).map(([key, config]) => (
              <button
                key={key}
                onClick={() => handleCategorySelect(key)}
                className={`px-3 py-1 rounded-full text-sm border transition-colors
                  ${selectedCategory === key 
                    ? `bg-${config.color} text-white` 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <config.icon className="inline w-4 h-4 mr-1" />
                {t(`categories.${key}.title`)}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Search Input - modified to handle category clearing */}
      <div className="relative w-full max-w-3xl">
        <input
          type="text"
          value={query}
          onChange={(e) => handleTextInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch(query)}
          placeholder={selectedCategory 
            ? t('search.categorySelected', { category: t(`categories.${selectedCategory}.title`) })
            : t('search.placeholder')
          }
          className="w-full px-6 py-4 text-lg rounded-full border-2 border-transparent focus:border-blue-400 focus:outline-none shadow-lg"
        />
        
        {/* Clear category button */}
        {selectedCategory && (
          <button
            onClick={() => { clearCategory(); setQuery(''); }}
            className="absolute right-16 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        
        {/* Existing search button */}
      </div>
      
      {/* Rest of existing component */}
    </section>
  );
};
```

### ✅ Success Criteria:

#### 🤖 Automated Verification:
- [ ] Frontend builds successfully: `cd react-frontend && npm run build`
- [ ] Frontend linting passes: `cd react-frontend && npm run lint`
- [ ] TypeScript compilation succeeds without errors
- [ ] All imports resolve correctly

#### 👨‍💻 Manual Verification:
- [ ] Category buttons appear before user interacts with search
- [ ] Clicking category button triggers immediate search with that category
- [ ] Selected category is visually highlighted
- [ ] Typing in search input clears selected category
- [ ] Search placeholder updates when category is selected
- [ ] Clear category button works correctly

---

## Phase 3: 🏠 Homepage Category Click Integration

### 🎯 Overview
Make homepage category cards clickable to redirect to the search component with pre-selected category.

### 🔧 Changes Required:

#### 1. Update CategoriesSection Component
**File**: `react-frontend/src/components/CategoriesSection.tsx`
**Changes**: Add click handlers to category cards

```typescript
// Add router import
import { useNavigate } from 'react-router-dom';

const CategoriesSection: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Add click handler
  const handleCategoryClick = (category: string) => {
    // Navigate to homepage with category search parameter
    navigate(`/?category=${category}&search=true`);
    
    // Scroll to search section after short delay for navigation
    setTimeout(() => {
      const searchSection = document.querySelector('[data-search-section]');
      if (searchSection) {
        searchSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  return (
    <section id="categories" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
          {t('categories.title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {Object.entries(categories).map(([key, config]) => (
            <div
              key={key}
              onClick={() => handleCategoryClick(key)}
              className="group bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
            >
              {/* Add visual feedback for interactivity */}
              <div className={`h-1 bg-gradient-to-r ${config.gradient} rounded-t-lg`} />
              
              <div className="p-6">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-r ${config.gradient} text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <config.icon className="w-6 h-6" />
                </div>
                
                <h3 className="text-xl font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                  {t(`categories.${key}.title`)}
                </h3>
                
                <p className="text-gray-600 text-sm mb-3 group-hover:text-gray-700 transition-colors">
                  {t(`categories.${key}.description`)}
                </p>
                
                <p className="text-xs text-gray-500 italic group-hover:text-gray-600 transition-colors">
                  {t(`categories.${key}.example`)}
                </p>
                
                {/* Add click indicator */}
                <div className="mt-4 text-blue-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  {t('categories.clickToSearch')} {/* "Click to search this category" */}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
```

#### 2. Update HeroSection for URL Parameters
**File**: `react-frontend/src/components/HeroSection.tsx`
**Changes**: Handle URL parameters for category pre-selection

```typescript
// Add URL parameter handling
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const HeroSection: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { 
    query, results, isLoading, error, hasSearched,
    selectedCategory, setSelectedCategory, clearCategory,
    handleSearch, clearSearch 
  } = useSearch();

  // Handle URL parameters on component mount
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const searchParam = searchParams.get('search');
    
    if (categoryParam && searchParam === 'true') {
      // Set category from URL and trigger search
      setSelectedCategory(categoryParam);
      handleSearch('', categoryParam);
      
      // Clear URL parameters after processing
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('category');
      newParams.delete('search');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSelectedCategory, handleSearch, setSearchParams]);

  // Add data attribute for scrolling reference
  return (
    <section 
      data-search-section
      className="relative bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen flex items-center"
    >
      {/* Rest of existing component */}
    </section>
  );
};
```

#### 3. Add Internationalization Keys
**File**: `react-frontend/public/locales/pt/translation.json`
**Changes**: Add new translation keys

```json
{
  "categories": {
    "clickToSearch": "Clique para pesquisar esta categoria"
  },
  "search": {
    "categoryPrompt": "Navegue por categoria ou pesquise abaixo",
    "categorySelected": "Pesquisando por: {{category}}"
  }
}
```

**File**: `react-frontend/public/locales/en/translation.json`
**Changes**: Add English translations

```json
{
  "categories": {
    "clickToSearch": "Click to search this category"
  },
  "search": {
    "categoryPrompt": "Browse by category or search below",
    "categorySelected": "Searching for: {{category}}"
  }
}
```

### ✅ Success Criteria:

#### 🤖 Automated Verification:
- [ ] Frontend builds successfully: `cd react-frontend && npm run build`
- [ ] Frontend linting passes: `cd react-frontend && npm run lint`
- [ ] TypeScript compilation succeeds without errors
- [ ] No console errors during category click navigation

#### 👨‍💻 Manual Verification:
- [ ] Category cards show visual hover effects indicating they're clickable
- [ ] Clicking category card navigates to search with that category pre-selected
- [ ] Page automatically scrolls to search section after category click
- [ ] URL parameters are handled correctly and cleaned up
- [ ] Selected category appears in search interface after navigation
- [ ] Internationalization works for both Portuguese and English

---

## 🧪 Testing Strategy

### Unit Tests:
- **Backend**: Category parameter validation in controllers
- **Backend**: SQL query generation with category filtering in services
- **Frontend**: Category state management in useSearch hook
- **Frontend**: URL parameter handling in HeroSection

### Integration Tests:
- **API endpoints**: Category filtering returns correct submissions
- **Navigation flow**: Homepage category click to search functionality
- **Search state**: Category selection and text input interaction

### Manual Testing Steps:

#### Test Category API Filtering:
1. Start backend server: `cd backend && npm run dev`
2. Test category filtering: `curl "localhost:1337/api/submissions?category=pessoa"`
3. Verify only pessoa submissions returned
4. Test invalid category: `curl "localhost:1337/api/submissions?category=invalid"`
5. Verify 400 error returned

#### Test Frontend Category Selection:
1. Start frontend: `cd react-frontend && npm run dev`
2. Open homepage and scroll to categories section
3. Click on "Pessoas" category card
4. Verify navigation to search with pessoa category pre-selected
5. Verify automatic scroll to search section
6. Verify search results show only pessoa submissions

#### Test Search Component Category Flow:
1. On homepage, verify category buttons appear before typing
2. Click on "Obras" category button
3. Verify immediate search execution and results
4. Start typing in search input
5. Verify category filter is removed and note appears in console
6. Verify search switches to fuzzy text search

### Visual Testing Script:
Create `react-frontend/test-category-search.js`:

```javascript
import { chromium } from 'playwright';

(async () => {
  console.log('🚀 Starting category search visual test...');
  
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  
  try {
    console.log('📄 Loading homepage...');
    await page.goto('http://localhost:8080');
    await page.waitForTimeout(3000);
    
    console.log('✅ Testing category card clicks:');
    await page.evaluate(() => {
      document.querySelector('#categories')?.scrollIntoView({ behavior: 'smooth' });
    });
    await page.waitForTimeout(2000);
    
    // Test clicking pessoa category
    console.log('   - Clicking "Pessoas" category...');
    await page.click('text=Pessoas');
    await page.waitForTimeout(3000);
    
    // Check if search section is visible and has results
    const searchSection = await page.locator('[data-search-section]').isVisible();
    console.log(`   - Search section visible: ${searchSection ? 'YES' : 'NO'}`);
    
    const results = await page.locator('[data-search-results]').count();
    console.log(`   - Search results found: ${results > 0 ? 'YES' : 'NO'}`);
    
    // Test category buttons in search
    console.log('✅ Testing search category buttons:');
    const categoryButtons = await page.locator('button:has-text("Obras")').count();
    console.log(`   - Category buttons visible: ${categoryButtons > 0 ? 'YES' : 'NO'}`);
    
    await page.waitForTimeout(120000); // Keep open for inspection
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();
```

## ⚡ Performance Considerations

### Database Optimization:
- **Existing index**: `idx_submissions_category` ensures fast category filtering
- **Query efficiency**: Category filtering uses exact match, very fast
- **Result caching**: Consider adding Redis caching for popular category searches

### Frontend Optimization:
- **Category config**: Category data is static, no API calls needed for category list
- **Debouncing**: Maintain 500ms debounce for text search, immediate for category search
- **Bundle impact**: No additional libraries required, minimal bundle size increase

## 📦 Migration Notes

### Database:
- **No migration required**: Category field and index already exist
- **Data compatibility**: Existing submissions with category data will work immediately

### API Compatibility:
- **Backward compatible**: Existing API calls without category parameter work unchanged
- **Additive changes**: Only adding optional category parameter, no breaking changes

### Frontend:
- **Component enhancement**: Existing components enhanced, no architectural changes
- **URL handling**: New URL parameter handling is optional and doesn't break existing functionality

## 📚 References

- **Category system research**: Frontend categories at `react-frontend/src/lib/categoryColors.ts:1-41`
- **Backend API structure**: Submissions service at `backend/services/submission.ts:1248-1335`
- **Search implementation**: Current search hook at `react-frontend/src/hooks/use-search.ts`
- **Homepage categories**: CategoriesSection component at `react-frontend/src/components/CategoriesSection.tsx`
- **Database schema**: Category field definition at `backend/database/schema.sql:51`

---

**Conclusion**: This implementation adds comprehensive category-based search functionality by extending the existing embedded search system with minimal architectural changes. The solution maintains backward compatibility while providing an intuitive user experience for category-based content discovery. The implementation resolves the immediate need while noting the category system inconsistency for future resolution.