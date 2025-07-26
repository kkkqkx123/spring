# Project Structure

## Full-Stack Architecture
This project follows a full-stack architecture with separate backend (Spring Boot) and frontend (React) applications.

## Backend Structure (Spring Boot)

### Root Level
- `pom.xml` - Maven configuration and dependencies
- `mvnw`, `mvnw.cmd` - Maven wrapper scripts
- `HELP.md` - Getting started documentation

### Source Organization
```
demo/src/
├── main/
│   ├── java/
│   │   └── com/example/demo/
│   │       ├── DemoApplication.java     # Main Spring Boot application
│   │       ├── ServletInitializer.java  # WAR deployment configuration
│   │       ├── controller/              # REST controllers
│   │       │   ├── AuthController.java
│   │       │   ├── EmployeeController.java
│   │       │   ├── DepartmentController.java
│   │       │   ├── ChatController.java
│   │       │   ├── EmailController.java
│   │       │   └── NotificationController.java
│   │       ├── service/                 # Business logic services
│   │       ├── repository/              # Data access layer
│   │       ├── model/                   # Entity and DTO classes
│   │       ├── security/                # Security configuration
│   │       ├── config/                  # Application configuration
│   │       └── exception/               # Exception handling
│   └── resources/
│       ├── application.properties       # Application configuration
│       ├── static/                      # Static web assets (for React build)
│       └── templates/                   # Server-side templates (if needed)
└── test/
    └── java/
        └── com/example/demo/            # Test classes mirror main structure
```

## Frontend Structure (React)

### Recommended React Project Structure
```
frontend/
├── public/                              # Static assets
├── src/
│   ├── components/                      # Reusable UI components
│   │   ├── ui/                         # Basic UI components (DataTable, FormField, etc.)
│   │   ├── forms/                      # Form components
│   │   └── layout/                     # Layout components (AppShell, Navigation, Header)
│   ├── features/                       # Feature-based modules
│   │   ├── auth/                       # Authentication feature
│   │   │   ├── components/             # Auth-specific components
│   │   │   ├── hooks/                  # Auth-specific hooks
│   │   │   ├── services/               # Auth API services
│   │   │   └── types/                  # Auth type definitions
│   │   ├── employees/                  # Employee management
│   │   ├── departments/                # Department management
│   │   ├── chat/                       # Chat functionality
│   │   ├── email/                      # Email management
│   │   ├── notifications/              # Notification system
│   │   └── permissions/                # Permission management
│   ├── hooks/                          # Global custom React hooks
│   ├── services/                       # API and external services
│   │   ├── api.ts                      # Base API client
│   │   ├── websocket.ts                # WebSocket client
│   │   └── auth.ts                     # Authentication service
│   ├── stores/                         # Zustand stores
│   │   ├── authStore.ts                # Authentication state
│   │   ├── uiStore.ts                  # UI state (theme, navigation)
│   │   └── notificationStore.ts        # Notification state
│   ├── types/                          # TypeScript type definitions
│   │   ├── api.ts                      # API response types
│   │   ├── auth.ts                     # Authentication types
│   │   └── entities.ts                 # Entity types
│   ├── utils/                          # Utility functions
│   ├── constants/                      # Application constants
│   └── assets/                         # Static assets (images, icons)
├── package.json                        # Node.js dependencies
├── vite.config.ts                      # Vite configuration
├── tsconfig.json                       # TypeScript configuration
└── vitest.config.ts                    # Testing configuration
```

## Package Conventions

### Backend (Spring Boot)
- **Base package**: `com.example.demo`
- **Controllers**: REST endpoints in `controller` package
- **Services**: Business logic in `service` and `service.impl` packages
- **Repositories**: Data access in `repository` package
- **Models**: Entities in `model.entity`, DTOs in `model.dto` packages
- **Security**: Authentication/authorization in `security` package
- **Configuration**: Application config in `config` package

### Frontend (React)
- **Feature-based organization**: Group related components, hooks, and services by feature
- **Component hierarchy**: UI components → Feature components → Layout components
- **Type definitions**: Centralized in `types/` with feature-specific types in feature folders
- **Service layer**: API clients and external service integrations
- **State management**: Separate stores for different concerns (auth, UI, notifications)

## Configuration Files

### Backend
- `application.properties` - Main configuration
- `application-{profile}.properties` - Environment-specific configs

### Frontend
- `package.json` - Dependencies and scripts
- `vite.config.ts` - Build tool configuration
- `tsconfig.json` - TypeScript compiler options
- `.env` files - Environment variables

## Build Artifacts
- **Backend**: `target/` - Maven build output, WAR file for deployment
- **Frontend**: `dist/` - Vite build output, optimized static files

## Development Guidelines

### Backend
- Keep the main application class minimal - only for bootstrapping
- Use `@SpringBootApplication` annotation on the main class
- Organize code by feature/domain rather than technical layers
- Use Maven commands: `mvn` (not `./mvnw` wrapper)
- Follow Spring Boot conventions for package structure

### Frontend
- Use feature-based organization for scalability
- Implement component-driven development with Storybook
- Follow TypeScript strict mode for type safety
- Use functional components with hooks
- Implement proper error boundaries and loading states
- Ensure accessibility compliance (WCAG 2.1)
- Write comprehensive tests for all components and features