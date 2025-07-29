# Employee Management System - Configuration Guide

## Overview

This document describes the configuration setup for the Employee Management System across different environments.

## Environment Profiles

The application supports multiple environment profiles:

- **dev** (default): Development environment with H2 database and debug logging
- **test**: Testing environment with in-memory database and minimal logging
- **staging**: Staging environment with PostgreSQL and moderate logging
- **prod**: Production environment with PostgreSQL, security hardening, and optimized settings

## Profile Activation

### Command Line

```bash
# Development (default)
java -jar employee-management-system.jar

# Production
java -jar employee-management-system.jar --spring.profiles.active=prod

# Staging
java -jar employee-management-system.jar --spring.profiles.active=staging

# Testing
java -jar employee-management-system.jar --spring.profiles.active=test
```

### Environment Variable

```bash
export SPRING_PROFILES_ACTIVE=prod
java -jar employee-management-system.jar
```

### Maven

```bash
# Development
mvn spring-boot:run

# Production
mvn spring-boot:run -Dspring-boot.run.profiles=prod
```

## Configuration Properties

### Core Application Properties

| Property | Description | Default | Required |
|----------|-------------|---------|----------|
| `spring.application.name` | Application name | employee-management-system | No |
| `server.port` | Server port | 8080 | No |
| `server.servlet.context-path` | Context path | /api | No |

### Database Configuration

#### Development (H2)

```properties
spring.datasource.url=jdbc:h2:mem:employeedb
spring.datasource.username=sa
spring.datasource.password=
```

#### Production (PostgreSQL)

```properties
spring.datasource.url=${DATABASE_URL}
spring.datasource.username=${DATABASE_USERNAME}
spring.datasource.password=${DATABASE_PASSWORD}
```

### Redis Configuration

| Property | Description | Default | Environment Variable |
|----------|-------------|---------|---------------------|
| `spring.redis.host` | Redis host | localhost | `REDIS_HOST` |
| `spring.redis.port` | Redis port | 6379 | `REDIS_PORT` |
| `spring.redis.password` | Redis password | (empty) | `REDIS_PASSWORD` |
| `spring.redis.database` | Redis database | 0 | `REDIS_DATABASE` |

### JWT Configuration

| Property | Description | Default | Environment Variable |
|----------|-------------|---------|---------------------|
| `app.jwt.secret` | JWT secret key | (required) | `JWT_SECRET` |
| `app.jwt.expirationMs` | Token expiration (ms) | 86400000 | `JWT_EXPIRATION` |
| `app.jwt.refreshExpirationMs` | Refresh token expiration (ms) | 604800000 | `JWT_REFRESH_EXPIRATION` |

### Email Configuration

| Property | Description | Default | Environment Variable |
|----------|-------------|---------|---------------------|
| `spring.mail.host` | SMTP host | (required) | `MAIL_HOST` |
| `spring.mail.port` | SMTP port | 587 | `MAIL_PORT` |
| `spring.mail.username` | SMTP username | (required) | `MAIL_USERNAME` |
| `spring.mail.password` | SMTP password | (required) | `MAIL_PASSWORD` |

### Security Configuration

| Property | Description | Default | Environment Variable |
|----------|-------------|---------|---------------------|
| `app.security.password.strength` | Password minimum length | 8 | `PASSWORD_STRENGTH` |
| `app.cors.allowed-origins` | CORS allowed origins | (required) | `CORS_ALLOWED_ORIGINS` |
| `app.websocket.allowed-origins` | WebSocket allowed origins | (required) | `WEBSOCKET_ALLOWED_ORIGINS` |

## Environment Variables

### Required for Production

```bash
# Database
export DATABASE_URL="jdbc:postgresql://localhost:5432/employeedb"
export DATABASE_USERNAME="employee_user"
export DATABASE_PASSWORD="your_secure_password"

# JWT
export JWT_SECRET="your_very_long_and_secure_jwt_secret_key_here"

# Email
export MAIL_HOST="smtp.gmail.com"
export MAIL_USERNAME="your-email@gmail.com"
export MAIL_PASSWORD="your-app-password"

# CORS and WebSocket
export CORS_ALLOWED_ORIGINS="https://yourdomain.com"
export WEBSOCKET_ALLOWED_ORIGINS="https://yourdomain.com"
```

### Optional Environment Variables

```bash
# Server
export SERVER_PORT=8080

# Redis
export REDIS_HOST="localhost"
export REDIS_PORT=6379
export REDIS_PASSWORD="redis_password"

# Security
export PASSWORD_STRENGTH=12
export SESSION_TIMEOUT="30m"

# SSL (if enabled)
export SSL_ENABLED=true
export SSL_KEYSTORE="/path/to/keystore.p12"
export SSL_KEYSTORE_PASSWORD="keystore_password"

# Logging
export LOG_FILE="/var/log/employee-management/application.log"
```

## Feature Flags

The application includes feature flags that can be enabled/disabled:

```properties
# Feature toggles
app.features.chat.enabled=true
app.features.email.enabled=true
app.features.notifications.enabled=true
app.features.payroll.enabled=true
app.features.excel-import.enabled=true
```

## Business Rules Configuration

```properties
# Business constraints
app.business.max-employees-per-department=1000
app.business.max-file-upload-size=50MB
app.business.session-timeout=30m
app.business.password-expiry-days=90
```

## Logging Configuration

### Development

- Root level: INFO
- Application level: DEBUG
- SQL logging: Enabled

### Production

- Root level: WARN
- Application level: INFO
- SQL logging: Disabled
- File logging: Enabled with rotation

### Log Files

- Location: `/var/log/employee-management/application.log`
- Max size: 10MB
- History: 30 days (prod), 7 days (staging)

## Monitoring and Health Checks

### Actuator Endpoints

#### Development

- All endpoints exposed: `/actuator/*`
- Health details: Always shown

#### Production

- Limited endpoints: `/actuator/health`, `/actuator/info`, `/actuator/metrics`
- Health details: Only when authorized

### Health Check URL

GET /api/actuator/health

## Security Considerations

### Production Security

- Error details hidden from responses
- HTTPS enforcement (when SSL enabled)
- Secure session cookies
- CSRF protection enabled
- Strong password requirements

### Development Security

- Error details included for debugging
- H2 console enabled
- Relaxed CORS settings
- Debug logging for security events

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`
   - Ensure database server is running
   - Verify network connectivity

2. **Redis Connection Failed**
   - Check `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
   - Ensure Redis server is running
   - Verify Redis configuration

3. **JWT Token Issues**
   - Ensure `JWT_SECRET` is set and sufficiently long (>= 32 characters)
   - Check token expiration settings

4. **Email Sending Failed**
   - Verify SMTP settings: `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`
   - Check firewall and network settings
   - Ensure email provider allows app passwords

5. **CORS Issues**
   - Check `CORS_ALLOWED_ORIGINS` matches frontend URL
   - Verify protocol (http vs https)
   - Check port numbers

### Debug Mode

Enable debug logging for troubleshooting:

```bash
java -jar employee-management-system.jar --logging.level.com.example.demo=DEBUG
```

## Configuration Validation

The application validates critical configuration on startup:

- JWT secret presence and length
- Database connectivity
- Redis connectivity
- Email configuration (if email features enabled)

Missing or invalid configuration will prevent application startup with clear error messages.
