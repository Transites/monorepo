# Debug API

Debug API issues in the Transitos backend by examining logs, testing endpoints, and analyzing request/response flow.

## Process

1. **Identify the Issue**:
   - What API endpoint is failing?
   - What error messages are you seeing?
   - Is it a frontend or backend issue?

2. **Check Backend Logs**:
   ```bash
   cd backend
   # Check application logs
   tail -f logs/combined.log
   tail -f logs/error.log
   
   # Or run in dev mode to see real-time logs
   npm run dev
   ```

3. **Test API Endpoints Directly**:
   ```bash
   # Test the main endpoints
   curl -v http://localhost:1337/api/submissions
   curl -v http://localhost:1337/api/submissions/id/1
   
   # Test with specific headers if needed
   curl -H "Content-Type: application/json" http://localhost:1337/api/submissions
   ```

4. **Check Database Connection**:
   ```bash
   cd backend
   # Test database connectivity
   npm run seed:admin  # This will fail if DB connection is broken
   ```

5. **Analyze Code Flow**:
   - Check `/backend/routes/` for route definitions
   - Check `/backend/controllers/` for request handling
   - Check `/backend/services/` for business logic
   - Check `/backend/middleware/` for authentication/validation

## Common Debugging Areas

### Authentication Issues
- Check trusted origin middleware in `/backend/middleware/auth.js`
- Verify request headers and origin
- Check if requests are coming from localhost:8080

### Database Issues  
- Verify PostgreSQL connection in `/backend/database/client.js`
- Check migration status
- Review database schema in `/backend/database/schema.sql`

### CORS Issues
- Check CORS configuration in `/backend/config/middlewares.js`
- Verify allowed origins include frontend URL

### Validation Errors
- Check validators in `/backend/validators/`
- Ensure request body matches expected schema

## Tools to Use

- **Read tool**: Examine specific controller/service files
- **Grep tool**: Search for error messages or specific functions
- **Bash tool**: Run curl commands and check logs

## Output Format

When debugging, provide:
1. **Problem description**: What's not working
2. **Investigation steps**: What you checked
3. **Findings**: Error messages, log entries, code issues
4. **Solution**: Specific fixes to implement
5. **Verification**: How to test the fix works