# Transitos Monorepo

This repository contains the Transitos project - an academic submission and encyclopedia management system developed for IEA-USP. It consists of a React frontend and Node.js/Express backend with PostgreSQL database.

## Architecture

- **React Frontend** (`/react-frontend/`) - Modern React 18 application with TypeScript and Tailwind CSS
- **Express.js Backend** (`/backend/`) - TypeScript API server with PostgreSQL database
- **Documentation** (`/docs/`) - Project documentation and API references

## Environment Variables

| Variable Name | Description | Example |
| ------------- | ----------- | ------- |
| VITE_CONTRIBUTE_EMAIL | Contact email for contributions | transitos@example.com |

## Development Setup

### Using Docker (Recommended)

```bash
# Start both frontend and backend
docker-compose up

# Stop services  
docker-compose down
```

### Manual Setup

#### Backend
```bash
cd backend
npm install
npm run dev
```

#### React Frontend
```bash
cd react-frontend
npm install
npm run dev
```

## Documentation

For detailed development information, see:
- `/CLAUDE.md` - Complete development guide
- `/docs/` - Technical documentation and API references
