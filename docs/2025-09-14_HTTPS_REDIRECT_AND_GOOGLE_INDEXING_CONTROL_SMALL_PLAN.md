# HTTPS Redirect and Google Indexing Control - Small Plan

**Date:** 2025-09-14
**Type:** Bug Fix + SEO Control
**Estimated Time:** 30 minutes
**Files Affected:** 1-2 files

## 🎯 What We're Doing

Fix Google indexing issue where site results redirect to HTTP version with port 8080, and temporarily hide site from Google indexing until official launch.

## 📍 Files to Change

### `react-frontend/public/robots.txt`
- Change from `Allow: /` to `Disallow: /` for all user agents
- This will hide the site from search engine indexing until launch
- Later can be easily reverted for launch

### Server Configuration (Outside Repository)
- The HTTP redirect issue with port 8080 needs to be fixed at the nginx/server level
- This is not in the codebase - requires server admin access
- Google results showing `http://enciclopedia.iea.usp.br:8080` instead of `https://enciclopedia.iea.usp.br`

## ✅ Success Criteria

**Quick Verification:**
- [ ] robots.txt updated: `cat react-frontend/public/robots.txt`
- [ ] Site builds correctly: `cd react-frontend && npm run build`
- [ ] Robots.txt deployed to production

**Test:**
- [ ] Visit `https://enciclopedia.iea.usp.br/robots.txt` - should show Disallow directives
- [ ] Google will eventually refresh its index (may take days/weeks)

## 📝 Implementation Notes

**Immediate Action:**
1. Update robots.txt to block all crawlers
2. This prevents new pages from being indexed while Google refreshes existing results

**Server-Side Issue:**
- The port 8080 redirect issue requires nginx configuration fix
- Current production setup binds services to localhost:8080 and localhost:1337
- Nginx should handle the HTTPS routing and hide internal ports
- This fix is outside the codebase scope

**For Launch Day:**
- Simply revert robots.txt changes to allow indexing again
- Submit updated sitemap to Google Search Console (when ready)

**Current Status:**
- Production docker-compose.prod.yml shows services bound to localhost with explicit ports
- VITE_API_BASE_URL correctly points to https://enciclopedia.iea.usp.br/api
- Issue is likely in nginx configuration not redirecting HTTP requests properly