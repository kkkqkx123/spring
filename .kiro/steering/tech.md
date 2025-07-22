# Technology Stack

## Core Technologies
- **Java 24** - Primary programming language
- **Spring Boot 3.5.3** - Application framework
- **Maven** - Build system and dependency management
- **Redis** - Database/Cache
- **Tomcat** - Embedded servlet container (provided scope for WAR deployment)

## Key Dependencies
- **Spring Boot Starter Web** - Web layer with Spring MVC
- **Spring Boot Starter Actuator** - Production monitoring and management
- **Spring Boot DevTools** - Development-time features (hot reload)
- **Lombok** - Code generation for boilerplate reduction
- **Spring Boot Configuration Processor** - Configuration metadata generation

## Build Commands

### Development
```bash
# Run the application in development mode
mvn spring-boot:run

# Run with specific profile
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

### Build & Test
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

### Useful Development Commands
```bash
# Generate sources (Lombok processing)
mvn generate-sources

# Check for dependency updates
mvn versions:display-dependency-updates
```

## Code Style Notes
- Use Lombok annotations to reduce boilerplate code
- Follow Spring Boot conventions for package structure
- Leverage Spring Boot's auto-configuration capabilities