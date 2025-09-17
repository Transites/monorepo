# SEO and Meta-Tags Implementation Plan

**Date:** 2025-09-08  
**Task:** Implement dynamic SEO and meta-tags for homepage and articles  
**Status:** 📋 PLANNED - Ready for implementation  

## 🎯 Overview

We need to implement dynamic SEO and meta-tag management for the Trânsitos academic encyclopedia to improve search engine visibility and social media sharing. Currently, all pages share the same static meta tags from `index.html`, which limits SEO effectiveness for individual articles and dynamic content.

## 📊 Current State Analysis

**Existing SEO Infrastructure:**
- ✅ Static meta tags in `react-frontend/index.html:6-18` with basic Open Graph and Twitter Cards
- ✅ Rich article data from `/api/submissions/id/:id` with comprehensive metadata
- ✅ Featured content API `/api/submissions` with dynamic homepage content
- ❌ No dynamic head management library (`react-helmet` or similar)
- ❌ Missing `/og-image.png` file referenced in current meta tags
- ❌ No structured data (JSON-LD) for search engines
- ❌ All pages share generic title/description regardless of content

**Available Article Metadata for SEO:**
- **Core Content**: `title`, `summary`, `author_name`, `keywords`, `category`
- **Rich Metadata**: `metadata.image`, biographical data, publication dates
- **Academic Information**: Works, bibliography, institutions, occupations
- **Timestamps**: `created_at`, `updated_at` for freshness signals

## 🚀 Desired End State

After implementation, the application will have:

1. **Dynamic Meta Tags**: Article pages show article-specific titles, descriptions, and Open Graph data
2. **Social Media Optimization**: Rich preview cards with article images and descriptions
3. **Structured Data**: JSON-LD markup for Person, Article, and Organization schemas
4. **Homepage SEO**: Dynamic meta updates based on featured content
5. **Fallback System**: Graceful degradation to default meta tags when content is unavailable

### 🔍 Key Discoveries:
- App entry point at `react-frontend/src/main.tsx:6` is simple and ready for HelmetProvider integration
- Static meta tags in `react-frontend/index.html:10-18` provide good foundation for fallbacks
- Article data structure from `/api/submissions/id/:id` contains rich SEO-ready metadata
- Current implementation uses TanStack Query for data fetching, perfect for meta tag integration

## ❌ What We're NOT Doing

**Out of Scope (Future Implementation):**
- **SEO-friendly URLs**: Converting from `/article/:uuid` to `/article/:slug` format - this requires significant routing changes and will be handled in a separate implementation
- **Server-Side Rendering (SSR)**: Keeping current SPA architecture - SSR would require major architectural changes
- **Sitemap generation**: Will be addressed after URL structure improvements
- **Advanced analytics integration**: Focus is purely on meta-tags and structured data
- **Multi-language SEO**: Using existing i18n infrastructure without SEO-specific enhancements

## 🛠️ Implementation Approach

**Strategy**: Implement `react-helmet-async` for dynamic head management with article-specific meta tags, Open Graph optimization, and JSON-LD structured data. Create reusable SEO components that integrate with existing API data structure and TanStack Query patterns.

**Libraries to Add:**
- `react-helmet-async`: Dynamic head management for SPA
- No additional dependencies required (will use existing TanStack Query and API structure)

---

## Phase 1: 📦 Foundation Setup

### 🎯 Overview
Set up react-helmet-async infrastructure and create the foundation for dynamic meta-tag management throughout the application.

### 🔧 Changes Required:

#### 1. Package Installation
**Command**: `cd react-frontend && npm install react-helmet-async`
**Purpose**: Add dynamic head management capability

#### 2. App Provider Setup
**File**: `react-frontend/src/main.tsx`
**Changes**: Wrap App with HelmetProvider for head management context

```typescript
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.tsx'
import './index.css'
import './i18n'

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
```

#### 3. SEO Hook Creation
**File**: `react-frontend/src/hooks/use-seo.ts` (new file)
**Changes**: Create reusable hook for SEO meta-tag generation

```typescript
import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import type { Submission } from '../lib/api';

interface SEOConfig {
  title?: string;
  description?: string;
  image?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  type?: 'website' | 'article';
  keywords?: string[];
}

export function useSEO(config: SEOConfig) {
  // Hook implementation for consistent SEO management
}
```

#### 4. Default OG Image
**File**: `react-frontend/public/og-image.png` (new file)
**Changes**: Create default Open Graph image (1200x630px) featuring Trânsitos branding

### ✅ Success Criteria:

#### 🤖 Automated Verification:
- [ ] Package installation succeeds: `cd react-frontend && npm list react-helmet-async`
- [ ] No TypeScript errors: `cd react-frontend && npm run build`
- [ ] Frontend linting passes: `cd react-frontend && npm run lint`
- [ ] Application starts without errors: `cd react-frontend && npm run dev`

#### 👨‍💻 Manual Verification:
- [ ] App loads normally with HelmetProvider wrapper
- [ ] Browser console shows no new errors or warnings
- [ ] Default og-image.png displays correctly when accessed at http://localhost:8080/og-image.png

---

## Phase 2: 🏠 Homepage Dynamic SEO

### 🎯 Overview
Implement dynamic meta-tags for the homepage that update based on featured content and maintain localization support.

### 🔧 Changes Required:

#### 1. Homepage SEO Component
**File**: `react-frontend/src/components/HomepageSEO.tsx` (new file)
**Changes**: Create component for homepage-specific meta-tags

```tsx
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useFeaturedContent } from '../hooks/use-featured-content';

export function HomepageSEO() {
  const { t, i18n } = useTranslation();
  const { data: featuredContent } = useFeaturedContent();
  
  // Generate dynamic description based on featured content
  // Include Open Graph and Twitter Card meta-tags
  // Support Portuguese/French localization
}
```

#### 2. Integration with Index Page
**File**: `react-frontend/src/pages/Index.tsx`
**Changes**: Add HomepageSEO component to homepage

```tsx
// Add import
import { HomepageSEO } from '../components/HomepageSEO';

export default function Index() {
  return (
    <>
      <HomepageSEO />
      <div className="min-h-screen bg-background">
        {/* Existing content */}
      </div>
    </>
  );
}
```

#### 3. Localization Updates
**File**: `react-frontend/public/locales/pt-BR/common.json`
**Changes**: Add SEO-related translation keys

```json
{
  "seo": {
    "homepageTitle": "Trânsitos | Circulations - Enciclopédia - USP",
    "homepageDescription": "Enciclopédia acadêmica sobre trânsitos e conexões franco-brasileiras",
    "featuredContentSuffix": "Explore artigos sobre {{topics}}"
  }
}
```

**File**: `react-frontend/public/locales/fr-FR/common.json`
**Changes**: Add French SEO translations

### ✅ Success Criteria:

#### 🤖 Automated Verification:
- [ ] Frontend builds successfully: `cd react-frontend && npm run build`
- [ ] Frontend linting passes: `cd react-frontend && npm run lint`
- [ ] No TypeScript errors in new components

#### 👨‍💻 Manual Verification:
- [ ] Homepage title updates dynamically in browser tab
- [ ] View page source shows dynamic meta descriptions
- [ ] Open Graph meta tags include featured content information
- [ ] Language switching updates meta-tags appropriately
- [ ] Social media sharing preview shows correct information

---

## Phase 3: 📰 Article-Specific SEO

### 🎯 Overview
Implement comprehensive SEO for individual article pages using rich metadata from the submissions API, including Open Graph images and article-specific information.

### 🔧 Changes Required:

#### 1. Article SEO Component
**File**: `react-frontend/src/components/ArticleSEO.tsx` (new file)
**Changes**: Create component for article-specific meta-tags and Open Graph optimization

```tsx
import { Helmet } from 'react-helmet-async';
import type { Submission } from '../lib/api';

interface ArticleSEOProps {
  article: Submission;
}

export function ArticleSEO({ article }: ArticleSEOProps) {
  // Generate article-specific title, description
  // Use article.metadata.image for Open Graph
  // Include author, publication date, keywords
  // Handle missing metadata gracefully
}
```

#### 2. Integration with Article Page
**File**: `react-frontend/src/pages/Article.tsx`
**Changes**: Add ArticleSEO component integration

```tsx
// Add import
import { ArticleSEO } from '../components/ArticleSEO';

export default function Article() {
  const { id } = useParams<{ id: string }>();
  const { data: article, isLoading, error } = useQuery({
    queryKey: ['submission', id],
    queryFn: () => getSubmissionById(id!),
    enabled: !!id,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error || !article) return <NotFound />;

  return (
    <>
      <ArticleSEO article={article} />
      <div className="min-h-screen bg-background">
        {/* Existing content */}
      </div>
    </>
  );
}
```

#### 3. SEO Utility Functions
**File**: `react-frontend/src/lib/seo-utils.ts` (new file)
**Changes**: Create utilities for SEO data processing

```typescript
import type { Submission } from './api';

export function generateArticleTitle(article: Submission): string {
  // Format: "Article Title | Trânsitos"
}

export function generateArticleDescription(article: Submission): string {
  // Use summary or extract from content (max 160 chars)
}

export function getArticleImage(article: Submission): string {
  // Return article.metadata.image.url or fallback to default
}

export function formatPublishedDate(dateString: string): string {
  // Format for structured data
}
```

### ✅ Success Criteria:

#### 🤖 Automated Verification:
- [ ] Frontend builds successfully: `cd react-frontend && npm run build`
- [ ] Frontend linting passes: `cd react-frontend && npm run lint`
- [ ] No TypeScript errors in article SEO components

#### 👨‍💻 Manual Verification:
- [ ] Article page titles show "Article Title | Trânsitos" format
- [ ] Meta descriptions use article summaries (truncated to 160 chars)
- [ ] Open Graph images use article.metadata.image when available
- [ ] Twitter Cards display correctly for article links
- [ ] Missing metadata gracefully falls back to defaults
- [ ] Author information appears correctly in meta tags

---

## Phase 4: 🔍 JSON-LD Structured Data

### 🎯 Overview
Implement JSON-LD structured data for better search engine understanding, focusing on Person schema for biographical articles and Article schema for all content.

### 🔧 Changes Required:

#### 1. Structured Data Hook
**File**: `react-frontend/src/hooks/use-structured-data.ts` (new file)
**Changes**: Create hook for generating Schema.org JSON-LD data

```typescript
import { useMemo } from 'react';
import type { Submission } from '../lib/api';

interface PersonSchema {
  "@context": "https://schema.org";
  "@type": "Person";
  name: string;
  birthDate?: string;
  deathDate?: string;
  jobTitle?: string[];
  affiliation?: object[];
  image?: string;
  sameAs?: string[];
}

interface ArticleSchema {
  "@context": "https://schema.org";
  "@type": "ScholarlyArticle";
  headline: string;
  description: string;
  author: object;
  datePublished: string;
  dateModified: string;
  image: string;
  publisher: object;
}

export function useStructuredData(article: Submission) {
  // Generate Person schema for biographical articles
  // Generate Article schema for all content
  // Include Organization schema for institutions
}
```

#### 2. Structured Data Component
**File**: `react-frontend/src/components/StructuredData.tsx` (new file)
**Changes**: Component to inject JSON-LD into document head

```tsx
import { Helmet } from 'react-helmet-async';
import { useStructuredData } from '../hooks/use-structured-data';
import type { Submission } from '../lib/api';

interface StructuredDataProps {
  article: Submission;
}

export function StructuredData({ article }: StructuredDataProps) {
  const schemas = useStructuredData(article);
  
  return (
    <Helmet>
      {schemas.map((schema, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}
```

#### 3. Integration with Article SEO
**File**: `react-frontend/src/components/ArticleSEO.tsx`
**Changes**: Include StructuredData component

```tsx
import { StructuredData } from './StructuredData';

export function ArticleSEO({ article }: ArticleSEOProps) {
  return (
    <>
      <Helmet>
        {/* Meta tag content */}
      </Helmet>
      <StructuredData article={article} />
    </>
  );
}
```

#### 4. Organization Schema for Homepage
**File**: `react-frontend/src/components/HomepageSEO.tsx`
**Changes**: Add IEA-USP organization schema

```tsx
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "name": "Instituto de Estudos Avançados da Universidade de São Paulo",
  "alternateName": "IEA-USP",
  "url": "https://www.iea.usp.br/"
};
```

### ✅ Success Criteria:

#### 🤖 Automated Verification:
- [ ] Frontend builds successfully: `cd react-frontend && npm run build`
- [ ] Frontend linting passes: `cd react-frontend && npm run lint`
- [ ] No TypeScript errors in structured data components
- [ ] JSON-LD validates using Google's Rich Results Test

#### 👨‍💻 Manual Verification:
- [ ] View page source shows JSON-LD scripts for articles
- [ ] Person schema includes biographical data when available
- [ ] Article schema includes correct publication dates and author info
- [ ] Organization schema appears on homepage
- [ ] Google Rich Results Test validates structured data
- [ ] No JSON parsing errors in browser console

---

## 🧪 Testing Strategy

### Unit Tests:
- SEO utility functions (title generation, description truncation)
- Structured data hook returns valid Schema.org JSON
- Component rendering with various article data scenarios

### Integration Tests:
- Meta tag updates when navigating between pages
- Open Graph data changes for different articles
- Fallback behavior for missing article metadata

### Manual Testing Steps:
1. **Homepage SEO**: Visit homepage, check page source for dynamic meta tags
2. **Article SEO**: Navigate to article, verify title/description updates
3. **Social Sharing**: Test Facebook/Twitter link preview generators
4. **Structured Data**: Use Google Rich Results Test on article URLs
5. **Fallback Handling**: Test with article missing image/description
6. **Language Switching**: Verify meta tags update with i18n changes

## ⚡ Performance Considerations

**Bundle Size Impact:**
- `react-helmet-async`: ~15KB gzipped (acceptable for SEO benefits)
- JSON-LD generation: Minimal runtime overhead
- Meta tag updates: No significant performance impact

**Runtime Performance:**
- Structured data generation memoized with `useMemo`
- Meta tag updates only occur on route changes
- Fallback handling optimized to avoid unnecessary renders

## 📦 Migration Notes

**Breaking Changes:** None - purely additive changes
**Deployment Requirements:** Standard build process, no server changes needed
**Rollback Plan:** Remove HelmetProvider wrapper and SEO components if issues arise

## 📚 References

- Original static meta tags: `react-frontend/index.html:10-18`
- Article data structure: `react-frontend/src/lib/api.ts:8-83`
- Featured content hook: `react-frontend/src/hooks/use-featured-content.ts`
- App routing: `react-frontend/src/App.tsx:18-25`

---

**Conclusion**: This implementation will provide comprehensive SEO optimization for the Trânsitos academic encyclopedia, improving search visibility and social media sharing while maintaining the existing SPA architecture. The modular approach ensures easy maintenance and future enhancements. SEO-friendly URLs (Phase 3 excluded) will be addressed in a separate implementation plan once the core SEO infrastructure is stable.