# Start Development Environment

Start the development environment for the Transitos project with all necessary services.

## Quick Start

Run the full development environment:
```bash
docker-compose up
```

This starts:
- **Backend**: Express.js server at `http://localhost:1337`
- **Frontend**: React/Vite dev server at `http://localhost:8080`

## Individual Services

### Backend Only
```bash
cd backend
npm run dev
```
- Starts Express server with nodemon + ts-node
- Auto-reloads on file changes
- Available at `http://localhost:1337`

### Frontend Only  
```bash
cd react-frontend
npm run dev
```
- Starts Vite dev server with hot reload
- Available at `http://localhost:8080`

## Environment Setup

1. **Database**: Ensure PostgreSQL is running with the database configured
2. **Environment Variables**: Check that `.env` files are properly set up
3. **Dependencies**: Run `npm install` in both `/backend` and `/react-frontend` if needed

## Verification

After starting services, verify they're working:

```bash
# Test backend health
curl http://localhost:1337/api/submissions

# Test frontend 
open http://localhost:8080
```

## Troubleshooting

Common issues:
- **Port conflicts**: Check if ports 1337 or 8080 are already in use
- **Database connection**: Verify DATABASE_URL environment variable
- **Missing dependencies**: Run `npm install` in affected directories
- **Permission errors**: Check file permissions and Docker setup

## Stopping Services

- **Docker**: `docker-compose down`
- **Individual**: `Ctrl+C` in the terminal running the service