# Article submission page

## Route

- **URL:** `/submissao/nova`
- **Component:** `react-frontend/src/pages/SubmitArticle.tsx`

## Features

- Author fields: name, email, institution (optional)
- Article metadata: title, category, comma-separated keywords
- Summary (plain textarea, 50–500 characters)
- Main content with rich text toolbar (bold, headings, lists, links, etc.)
- Optional additional sections (`metadata.sections[]`) with title + rich content each
- Client validation via Zod + React Hook Form (aligned with backend limits)
- Submit calls `POST /api/submissions` through `createArticleSubmission()` in `api.ts`

## Backend

The frontend is ready; the write endpoint may still need to be enabled or replaced. Expected payload shape:

```json
{
  "author_name": "string",
  "author_email": "string",
  "author_institution": "string?",
  "title": "string",
  "summary": "string",
  "content": "string (HTML)",
  "keywords": ["string"],
  "category": "string",
  "metadata": {
    "sections": [{ "title": "string", "content": "string (HTML)" }]
  }
}
```

## Related files

| File | Purpose |
|------|---------|
| `src/components/RichTextEditor.tsx` | contentEditable editor + DOMPurify |
| `src/lib/submission-schema.ts` | Zod schema and payload mapper |
| `src/lib/submission-constants.ts` | Category list |
| `src/lib/api.ts` | `createArticleSubmission()` |

## Navigation

Header links **Submeter** (desktop and mobile) point to `/submissao/nova`.
