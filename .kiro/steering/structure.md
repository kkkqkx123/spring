# Project Structure

## Root Level
- `pom.xml` - Maven configuration and dependencies
- `mvnw`, `mvnw.cmd` - Maven wrapper scripts
- `HELP.md` - Getting started documentation

## Source Organization
```
src/
├── main/
│   ├── java/
│   │   └── com/example/demo/
│   │       ├── DemoApplication.java     # Main Spring Boot application
│   │       └── ServletInitializer.java  # WAR deployment configuration
│   └── resources/
│       ├── application.properties       # Application configuration
│       ├── static/                      # Static web assets
│       └── templates/                   # View templates
└── test/
    └── java/
        └── com/example/demo/            # Test classes mirror main structure
```

## Package Conventions
- **Base package**: `com.example.demo`
- Follow standard Spring Boot package organization:
  - Controllers in `controller` package
  - Services in `service` package  
  - Repositories in `repository` package
  - Models/Entities in `model` or `entity` package
  - Configuration classes in `config` package

## Configuration Files
- `application.properties` - Main configuration (prefer over YAML for simplicity)
- Profile-specific configs: `application-{profile}.properties`

## Build Artifacts
- `target/` - Maven build output directory
- WAR file generated for deployment to external servlet containers

## Development Guidelines
- Keep the main application class minimal - only for bootstrapping
- Use `@SpringBootApplication` annotation on the main class
- Organize code by feature/domain rather than technical layers when the application grows
- Place static resources in `src/main/resources/static/`
- Use `src/main/resources/templates/` for server-side templates if needed