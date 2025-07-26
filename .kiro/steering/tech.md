# Technology Stack

## Backend Technologies (Spring Boot)

### Core Technologies
- **Java 24** - Primary programming language
- **Spring Boot 3.5.3** - Application framework
- **Maven** - Build system and dependency management
- **Redis** - Database/Cache
- **Tomcat** - Embedded servlet container (provided scope for WAR deployment)

### Key Dependencies
- **Spring Boot Starter Web** - Web layer with Spring MVC
- **Spring Boot Starter WebSocket** - Real-time communication support
- **Spring Boot Starter Security** - Authentication and authorization
- **Spring Boot Starter Data JPA** - Database access layer
- **Spring Boot Starter Actuator** - Production monitoring and management
- **Spring Boot DevTools** - Development-time features (hot reload)
- **Lombok** - Code generation for boilerplate reduction
- **Spring Boot Configuration Processor** - Configuration metadata generation

### Backend Build Commands

#### Development
```bash
# Run the application in development mode
mvn spring-boot:run

# Run with specific profile
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

#### Build & Test
```bash
# Clean and compile
mvn clean compile

# Run tests
mvn test

# Package as WAR
mvn clean package

# Skip tests during build
mvn clean package -DskipTests
```

#### Useful Development Commands
```bash
# Generate sources (Lombok processing)
mvn generate-sources

# Check for dependency updates
mvn versions:display-dependency-updates
```

## Frontend Technologies (React)

### Core Technologies
- **React 18+** - Frontend framework with modern features
- **TypeScript** - Type-safe JavaScript development
- **Vite** - Fast build tool and development server
- **Node.js** - JavaScript runtime for development tools

### State Management
- **Zustand** - Lightweight global state management
- **TanStack Query (React Query)** - Server state management and caching
- **React Hook Form** - Form state management and validation

### UI and Styling
- **Mantine** - Comprehensive React component library
- **CSS Modules** - Scoped styling with Mantine theming
- **React Router v6** - Client-side routing

### Real-time and Communication
- **Socket.IO Client** - WebSocket client for real-time features
- **Axios** - HTTP client for API communication

### Development and Testing
- **Vitest** - Fast unit test runner
- **React Testing Library** - Component testing utilities
- **MSW (Mock Service Worker)** - API mocking for tests
- **Playwright** - End-to-end testing framework
- **ESLint + Prettier** - Code quality and formatting
- **TypeScript Strict Mode** - Enhanced type checking

### Validation and Forms
- **Zod** - Runtime type validation and schema definition
- **React Hook Form** - Performant form management

### Frontend Build Commands

#### Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start development server with specific port
npm run dev -- --port 3000
```

#### Build & Test
```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

#### Quality Assurance
```bash
# Run all tests with coverage
npm run test:coverage

# Bundle analysis
npm run analyze

# Accessibility audit
npm run a11y
```

## Development Workflow

### Full-Stack Development
1. **Backend First**: Start Spring Boot application for API development
2. **Frontend Development**: Use Vite dev server with proxy to backend
3. **Real-time Features**: Ensure WebSocket endpoints are running
4. **Testing**: Run both backend and frontend tests
5. **Integration**: Test full-stack features end-to-end

### Recommended Development Setup
```bash
# Terminal 1: Backend
cd demo
mvn spring-boot:run

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Testing (as needed)
npm run test:watch
```

## Code Style and Best Practices

### Backend (Spring Boot)
- Use Lombok annotations to reduce boilerplate code
- Follow Spring Boot conventions for package structure
- Leverage Spring Boot's auto-configuration capabilities
- Use Maven commands directly (not wrapper scripts)
- Implement proper exception handling and validation
- Use DTOs for API responses to avoid exposing entities
- Implement comprehensive logging with SLF4J

### Frontend (React)
- Use TypeScript strict mode for enhanced type safety
- Follow functional component patterns with hooks
- Implement proper error boundaries for error handling
- Use feature-based folder organization
- Write comprehensive tests for components and hooks
- Ensure accessibility compliance (WCAG 2.1)
- Implement proper loading states and user feedback
- Use semantic HTML and proper ARIA labels
- Follow React best practices for performance optimization

### Integration
- Use consistent API response formats between backend and frontend
- Implement proper error handling across the full stack
- Ensure real-time features work reliably with WebSocket connections
- Maintain type safety between backend DTOs and frontend interfaces
- Use environment variables for configuration management