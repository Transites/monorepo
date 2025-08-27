# Transitos React Frontend

This is the React frontend for the Transitos project - an academic submission and encyclopedia management system developed for IEA-USP. This modern frontend provides an intuitive interface for exploring the rich cultural exchanges between Brazil and France.

## Project Overview

The React frontend serves as the user interface for the Transitos encyclopedia, featuring:
- Modern, responsive design built with React and TypeScript
- Component library based on shadcn/ui and Radix UI
- Styled with Tailwind CSS for consistent theming
- Built with Vite for fast development and optimized builds

## Technology Stack

This project is built with:

- **React 18** - Modern React with functional components and hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **shadcn/ui** - High-quality component library built on Radix UI
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Unstyled, accessible UI primitives
- **React Router** - Client-side routing
- **React Query (TanStack Query)** - Data fetching and state management
- **Lucide React** - Beautiful icons

## Development Setup

### Prerequisites

- Node.js (recommended via [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- npm or yarn package manager

### Installation

```sh
# Navigate to the react-frontend directory
cd react-frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will be available at `http://localhost:8080`

## Available Scripts

```sh
# Development
npm run dev              # Start development server with hot reload

# Building
npm run build           # Production build
npm run build:dev       # Development build
npm run preview         # Preview production build

# Code Quality
npm run lint            # Run ESLint
```

## Environment Variables

Create a `.env` file in the react-frontend directory with the following variables:

```env
# Backend API Configuration
VITE_API_BASE_URL=http://localhost:3000/api
VITE_STRAPI_BASE_URL=http://localhost:1337/api

# Contact Configuration
VITE_CONTRIBUTE_EMAIL=your-email@example.com

# Environment
VITE_NODE_ENV=development
```

### Available Environment Variables

- `VITE_API_BASE_URL`: Base URL for the backend API
- `VITE_STRAPI_BASE_URL`: Base URL for the Strapi CMS API
- `VITE_CONTRIBUTE_EMAIL`: Email address for contribution inquiries
- `VITE_NODE_ENV`: Environment mode (development/production)

## Project Structure

```
react-frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── AboutSection.tsx
│   │   ├── Header.tsx
│   │   ├── HeroSection.tsx
│   │   └── ...
│   ├── pages/              # Page components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   └── App.tsx             # Main application component
├── public/                 # Static assets
├── components.json         # shadcn/ui configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
└── vite.config.ts         # Vite configuration
```

## Internationalization (i18n)

*Future Enhancement*: The application is designed to support internationalization for Portuguese and French languages. This will be implemented using react-i18next or a similar i18n solution to support the bilingual nature of the Franco-Brazilian cultural project.

## Component Library

The project uses shadcn/ui, a collection of reusable components built on top of Radix UI primitives. These components are:
- Copy-pasted into the project for full customization control
- Built with accessibility in mind
- Styled with Tailwind CSS
- Type-safe with TypeScript

To check which UI components are actively used in the project:
```sh
# Search for component imports
grep -r "from '@/components/ui" src/
```

## IDE Setup

### Recommended Extensions (VS Code)

- [ES7+ React/Redux/React-Native snippets](https://marketplace.visualstudio.com/items?itemName=dsznajder.es7-react-js-snippets)
- [TypeScript Hero](https://marketplace.visualstudio.com/items?itemName=rbbit.typescript-hero)
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)
- [Auto Rename Tag](https://marketplace.visualstudio.com/items?itemName=formulahendry.auto-rename-tag)

## Contributing

This frontend integrates with the Transitos backend API. When making changes:

1. Ensure compatibility with the existing backend API endpoints
2. Follow the established component patterns and naming conventions
3. Use TypeScript for type safety
4. Test thoroughly across different screen sizes
5. Maintain accessibility standards

For more information about the overall project architecture, see the main [project README](../README.md).
