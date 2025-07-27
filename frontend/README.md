# Employee Management System - Frontend

A modern React frontend application built with TypeScript, Vite, and Mantine UI for the Employee Management System.

## 🚀 Tech Stack

- **React 18+** - Modern React with functional components and hooks
- **TypeScript** - Type-safe JavaScript development
- **Vite** - Fast build tool and development server
- **Mantine** - Comprehensive React component library
- **Zustand** - Lightweight state management
- **TanStack Query** - Server state management and caching
- **React Router v6** - Client-side routing
- **React Hook Form + Zod** - Form management and validation
- **Socket.IO Client** - Real-time communication
- **Axios** - HTTP client for API communication
- **Vitest** - Fast unit test runner
- **ESLint + Prettier** - Code quality and formatting

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI components
│   ├── forms/          # Form components
│   └── layout/         # Layout components
├── features/           # Feature-based modules
│   ├── auth/           # Authentication feature
│   ├── employees/      # Employee management
│   ├── departments/    # Department management
│   ├── chat/           # Chat functionality
│   ├── email/          # Email management
│   ├── notifications/  # Notification system
│   └── permissions/    # Permission management
├── hooks/              # Custom React hooks
├── services/           # API and external services
├── stores/             # Zustand stores
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── constants/          # Application constants
└── assets/             # Static assets
```

## 🛠️ Development

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check

# Type checking
npm run type-check
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8080/api
VITE_WS_BASE_URL=ws://localhost:8080

# Application Configuration
VITE_APP_NAME=Employee Management System
VITE_APP_VERSION=1.0.0

# Development Configuration
VITE_ENABLE_DEVTOOLS=true
```

### Path Aliases

The project uses path aliases for cleaner imports:

- `@/` - src directory
- `@components/` - components directory
- `@features/` - features directory
- `@hooks/` - hooks directory
- `@services/` - services directory
- `@stores/` - stores directory
- `@types/` - types directory
- `@utils/` - utils directory
- `@constants/` - constants directory
- `@assets/` - assets directory

## 🏗️ Architecture

### State Management

- **Zustand** for global state (auth, UI preferences)
- **TanStack Query** for server state management
- **React Hook Form** for form state
- **Local state** with useState/useReducer for component-specific state

### API Integration

- Centralized API client with Axios
- Automatic token management
- Request/response interceptors
- Error handling and retry logic
- Type-safe API calls

### Real-time Features

- WebSocket integration with Socket.IO
- Event bus pattern for real-time updates
- Automatic reconnection handling
- Real-time chat and notifications

### Testing Strategy

- **Unit Tests** (70%) - Components, hooks, utilities
- **Integration Tests** (20%) - Feature workflows
- **E2E Tests** (10%) - Critical user paths

## 🎨 UI Components

Built with Mantine UI library providing:

- Consistent design system
- Accessibility compliance (WCAG 2.1)
- Responsive design
- Dark/light theme support
- Comprehensive component library

## 🔐 Security

- JWT token management
- Role-based access control
- Route protection
- Input sanitization
- CSRF protection
- Secure API communication

## 📱 Responsive Design

- Mobile-first approach
- Responsive breakpoints
- Touch-friendly interactions
- Adaptive layouts
- Cross-browser compatibility

## 🚀 Performance

- Code splitting and lazy loading
- Bundle optimization
- Virtual scrolling for large lists
- Memoization strategies
- Efficient re-rendering

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test -- auth.test.ts

# Run tests in watch mode
npm run test:watch
```

## 📦 Build & Deployment

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

The build artifacts will be stored in the `dist/` directory.

## 🤝 Contributing

1. Follow the established project structure
2. Write tests for new features
3. Ensure code passes linting and type checking
4. Follow the component and naming conventions
5. Update documentation as needed

## 📄 License

This project is part of the Employee Management System.