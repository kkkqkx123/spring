# Employee Management System - Deployment Guide

## Overview

This guide covers the deployment of the Employee Management System as a WAR file to external servlet containers.

## Prerequisites

### System Requirements

- Java 24 or higher
- Servlet container (Tomcat 10+, Jetty 11+, or Undertow)
- PostgreSQL 12+ (for production)
- Redis 6+ (for caching and sessions)
- Minimum 2GB RAM
- Minimum 1GB disk space

### Environment Setup

- Ensure all required environment variables are set
- Database and Redis servers are running and accessible
- SMTP server configured for email functionality

## Build Process

### 1. Build WAR File

#### Development Build

```bash
mvn clean package
```

#### Production Build

```bash
mvn clean package -Pprod
```

#### Staging Build

```bash
mvn clean package -Pstaging
```

#### Skip Tests (if needed)

```bash
mvn clean package -DskipTests
```

### 2. Build Output

The WAR file will be generated at:

target/employee-management-system.war

## Deployment Methods

### Method 1: Tomcat Deployment

#### 1. Copy WAR File

```bash
cp target/employee-management-system.war $CATALINA_HOME/webapps/
```

#### 2. Set Environment Variables

Create or edit `$CATALINA_HOME/bin/setenv.sh`:

```bash
#!/bin/bash

# Java Options
export JAVA_OPTS="-Xms1024m -Xmx2048m -XX:+UseG1GC"

# Spring Profile
export SPRING_PROFILES_ACTIVE=prod

# Database Configuration
export DATABASE_URL="jdbc:postgresql://localhost:5432/employeedb"
export DATABASE_USERNAME="employee_user"
export DATABASE_PASSWORD="your_secure_password"

# Redis Configuration
export REDIS_HOST="localhost"
export REDIS_PORT=6379
export REDIS_PASSWORD="redis_password"

# JWT Configuration
export JWT_SECRET="your_very_long_and_secure_jwt_secret_key_here"

# Email Configuration
export MAIL_HOST="smtp.gmail.com"
export MAIL_USERNAME="your-email@gmail.com"
export MAIL_PASSWORD="your-app-password"

# CORS Configuration
export CORS_ALLOWED_ORIGINS="https://yourdomain.com"
export WEBSOCKET_ALLOWED_ORIGINS="https://yourdomain.com"

# SSL Configuration (if using HTTPS)
export SSL_ENABLED=true
export SSL_KEYSTORE="/path/to/keystore.p12"
export SSL_KEYSTORE_PASSWORD="keystore_password"
```

#### 3. Start Tomcat

```bash
$CATALINA_HOME/bin/startup.sh
```

#### 4. Verify Deployment

- Check logs: `tail -f $CATALINA_HOME/logs/catalina.out`
- Access health check: `http://localhost:8080/employee-management-system/api/actuator/health`

### Method 2: Jetty Deployment

#### 1. Copy WAR File

```bash
cp target/employee-management-system.war $JETTY_HOME/webapps/
```

#### 2. Configure Environment

Create `$JETTY_HOME/start.d/employee-management.ini`:

```ini
# Environment variables
-Dspring.profiles.active=prod
-DDATABASE_URL=jdbc:postgresql://localhost:5432/employeedb
-DDATABASE_USERNAME=employee_user
-DDATABASE_PASSWORD=your_secure_password
-DREDIS_HOST=localhost
-DREDIS_PORT=6379
-DJWT_SECRET=your_very_long_and_secure_jwt_secret_key_here
```

#### 3. Start Jetty

```bash
java -jar $JETTY_HOME/start.jar
```

### Method 3: Standalone Deployment

#### 1. Extract WAR (Optional)

```bash
mkdir employee-management-system
cd employee-management-system
jar -xf ../target/employee-management-system.war
```

#### 2. Run with Java

```bash
java -jar target/employee-management-system.war \
  --spring.profiles.active=prod \
  --server.port=8080
```

## Configuration

### 1. External Configuration

#### Option A: Environment Variables

Set all required environment variables as shown in the Tomcat example above.

#### Option B: External Properties File

Create `application-prod.properties` in the classpath or working directory:

```properties
# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/employeedb
spring.datasource.username=employee_user
spring.datasource.password=your_secure_password

# Redis
spring.redis.host=localhost
spring.redis.port=6379
spring.redis.password=redis_password

# JWT
app.jwt.secret=your_very_long_and_secure_jwt_secret_key_here

# Email
spring.mail.host=smtp.gmail.com
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password

# CORS
app.cors.allowed-origins=https://yourdomain.com
app.websocket.allowed-origins=https://yourdomain.com
```

#### Option C: Command Line Arguments

```bash
java -jar employee-management-system.war \
  --spring.profiles.active=prod \
  --spring.datasource.url=jdbc:postgresql://localhost:5432/employeedb \
  --spring.datasource.username=employee_user \
  --spring.datasource.password=your_secure_password
```

### 2. SSL Configuration

#### Generate Keystore

```bash
keytool -genkeypair -alias employee-mgmt -keyalg RSA -keysize 2048 \
  -storetype PKCS12 -keystore employee-mgmt.p12 -validity 3650 \
  -dname "CN=yourdomain.com,OU=IT,O=YourCompany,L=City,ST=State,C=US"
```

#### Configure SSL

```bash
export SSL_ENABLED=true
export SSL_KEYSTORE="/path/to/employee-mgmt.p12"
export SSL_KEYSTORE_PASSWORD="your_keystore_password"
```

## Database Setup

### 1. PostgreSQL Setup

#### Create Database and User

```sql
-- Connect as postgres superuser
CREATE DATABASE employeedb;
CREATE USER employee_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE employeedb TO employee_user;

-- Connect to employeedb
\c employeedb
GRANT ALL ON SCHEMA public TO employee_user;
```

#### Run Database Migrations

The application will automatically create tables on first startup with `spring.jpa.hibernate.ddl-auto=update`.

For production, consider using Flyway or Liquibase for database migrations.

### 2. Redis Setup

#### Install and Configure Redis

```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# CentOS/RHEL
sudo yum install redis

# Configure Redis
sudo nano /etc/redis/redis.conf
```

#### Redis Configuration

```conf
# Bind to specific interface
bind 127.0.0.1

# Set password
requirepass your_redis_password

# Enable persistence
save 900 1
save 300 10
save 60 10000
```

#### Start Redis

```bash
sudo systemctl start redis
sudo systemctl enable redis
```

## Monitoring and Logging

### 1. Application Logs

#### Log Location

- Tomcat: `$CATALINA_HOME/logs/`
- Jetty: `$JETTY_HOME/logs/`
- Standalone: `/var/log/employee-management/application.log`

#### Log Configuration

Set log level via environment variable:

```bash
export LOGGING_LEVEL_COM_EXAMPLE_DEMO=INFO
```

### 2. Health Checks

#### Health Endpoint

```bash
curl http://localhost:8080/employee-management-system/api/actuator/health
```

#### Expected Response

```json
{
  "status": "UP",
  "components": {
    "db": {"status": "UP"},
    "redis": {"status": "UP"},
    "mail": {"status": "UP"}
  }
}
```

### 3. Metrics

#### Metrics Endpoint

```bash
curl http://localhost:8080/employee-management-system/api/actuator/metrics
```

#### Prometheus Integration

Add to `application-prod.properties`:

```properties
management.metrics.export.prometheus.enabled=true
```

## Security Considerations

### 1. Production Security Checklist

- [ ] Change default passwords
- [ ] Use strong JWT secret (minimum 32 characters)
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall rules
- [ ] Set up proper CORS origins
- [ ] Enable security headers
- [ ] Configure session timeout
- [ ] Set up log monitoring
- [ ] Regular security updates

### 2. Network Security

```bash
# Allow only necessary ports
sudo ufw allow 8080/tcp  # Application port
sudo ufw allow 443/tcp   # HTTPS
sudo ufw deny 8080/tcp from any to any  # Deny direct access if behind proxy
```

### 3. Reverse Proxy Configuration (Nginx)

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    location / {
        proxy_pass http://localhost:8080/employee-management-system;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api/ws {
        proxy_pass http://localhost:8080/employee-management-system/api/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## Troubleshooting

### Common Issues

#### 1. Application Won't Start

- Check Java version: `java -version`
- Verify environment variables are set
- Check database connectivity
- Review application logs

#### 2. Database Connection Failed

```bash
# Test database connection
psql -h localhost -U employee_user -d employeedb
```

#### 3. Redis Connection Failed

```bash
# Test Redis connection
redis-cli -h localhost -p 6379 -a your_redis_password ping
```

#### 4. Email Not Sending

- Verify SMTP settings
- Check firewall rules for SMTP port
- Test email credentials

#### 5. WebSocket Connection Issues

- Check CORS and WebSocket allowed origins
- Verify proxy configuration for WebSocket upgrade
- Check firewall rules

### Debug Mode

Enable debug logging:

```bash
export LOGGING_LEVEL_COM_EXAMPLE_DEMO=DEBUG
export LOGGING_LEVEL_ORG_SPRINGFRAMEWORK_SECURITY=DEBUG
```

### Performance Tuning

#### JVM Options

```bash
export JAVA_OPTS="-Xms2g -Xmx4g -XX:+UseG1GC -XX:MaxGCPauseMillis=200"
```

#### Database Connection Pool

```properties
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=30000
```

#### Redis Configuration

```properties
spring.redis.jedis.pool.max-active=8
spring.redis.jedis.pool.max-idle=8
spring.redis.jedis.pool.min-idle=0
```

## Backup and Recovery

### 1. Database Backup

```bash
# Create backup
pg_dump -h localhost -U employee_user employeedb > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
psql -h localhost -U employee_user employeedb < backup_20240101_120000.sql
```

### 2. Redis Backup

```bash
# Create backup
redis-cli -h localhost -p 6379 -a your_redis_password --rdb dump.rdb

# Restore backup
cp dump.rdb /var/lib/redis/
sudo systemctl restart redis
```

### 3. Application Files Backup

```bash
# Backup configuration and logs
tar -czf app_backup_$(date +%Y%m%d_%H%M%S).tar.gz \
  /path/to/application.properties \
  /var/log/employee-management/
```

## Maintenance

### 1. Regular Tasks

- Monitor disk space and logs
- Update dependencies and security patches
- Backup database and configuration
- Monitor application performance
- Review security logs

### 2. Updates

```bash
# Stop application
sudo systemctl stop tomcat

# Backup current WAR
cp webapps/employee-management-system.war webapps/employee-management-system.war.backup

# Deploy new version
cp new-version/employee-management-system.war webapps/

# Start application
sudo systemctl start tomcat
```

This deployment guide provides comprehensive instructions for deploying the Employee Management System in production environments with proper security, monitoring, and maintenance procedures.
