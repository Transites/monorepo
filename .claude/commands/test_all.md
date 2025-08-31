# Test All

Run comprehensive tests across the entire Transitos monorepo to ensure everything is working correctly.

## Process

1. **Backend Testing**:
   ```bash
   cd backend
   npm test                    # Unit tests
   npm run test:integration    # Integration tests
   npm run test:coverage       # Coverage report
   npm run lint               # Linting
   npm run build              # Build verification
   ```

2. **Frontend Testing**:
   ```bash
   cd react-frontend
   npm run lint               # Linting
   npm run build              # Build verification
   ```

3. **Database Testing** (if needed):
   ```bash
   cd fuzzy-search-experiments
   node run-all-tests.js      # Database fuzzy search tests
   ```

## Output Format

Present results in this format:

```
## Test Results Summary

### Backend
✓ Unit tests: All passed (X tests)
✓ Integration tests: All passed (Y tests)  
✓ Linting: No issues
✓ Build: Successful
✗ Coverage: Below threshold (current: Z%)

### Frontend
✓ Linting: No issues
✓ Build: Successful

### Overall Status: PASS/FAIL
```

## When to Use

- Before creating pull requests
- After implementing new features
- When debugging issues across the codebase
- During code review process
- Before deployment

## Troubleshooting

If tests fail:
1. Show the exact error messages
2. Identify which component (backend/frontend) is affected
3. Suggest specific fixes based on the error type
4. Re-run tests after fixes to confirm resolution