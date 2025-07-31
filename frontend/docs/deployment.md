# Deployment Guide

This guide covers the deployment process for the Employee Management System frontend application.

## Overview

The application supports multiple deployment strategies:
- **Static hosting** (Netlify, Vercel, AWS S3 + CloudFront)
- **Container deployment** (Docker, Kubernetes)
- **Traditional server deployment** (Nginx, Apache)

## Prerequisites

### Development Environment
- Node.js 18+ 
- npm 8+
- Git

### Production Environment
- Web server (Nginx recommended)
- SSL certificate
- CDN (optional but recommended)

### CI/CD Environment
- Docker (for containerized deployments)
- AWS CLI (for AWS deployments)
- kubectl (for Kubernetes deployments)

## Environment Configuration

### Environment Variables

Create environment-specific `.env` files:

#### Development (`.env.development`)
```bash
VITE_APP_ENV=development
VITE_API_BASE_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080/ws
VITE_DEBUG_MODE=true
VITE_ENABLE_DEVTOOLS=true
```

#### Staging (`.env.staging`)
```bash
VITE_APP_ENV=staging
VITE_API_BASE_URL=https://staging-api.yourcompany.com
VITE_WS_URL=wss://staging-api.yourcompany.com/ws
VITE_DEBUG_MODE=true
VITE_ENABLE_ANALYTICS=true
VITE_STRICT_CSP=true
```

#### Production (`.env.production`)
```bash
VITE_APP_ENV=production
VITE_API_BASE_URL=https://api.yourcompany.com
VITE_WS_URL=wss://api.yourcompany.com/ws
VITE_DEBUG_MODE=false
VITE_ENABLE_ANALYTICS=true
VITE_STRICT_CSP=true
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

## Build Process

### Development Build
```bash
npm run dev
```

### Production Build
```bash
# Standard build
npm run build

# Production build with all checks
npm run build:production

# Build with bundle analysis
npm run build:analyze
```

### Build Verification
```bash
# Check bundle sizes
npm run size-check

# Security audit
npm run security:audit

# Type checking
npm run type-check

# Run all tests
npm run test:all
```

## Deployment Strategies

### 1. Static Hosting Deployment

#### Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod --dir=dist

# Or use environment variable
export NETLIFY_SITE_ID=your-site-id
npm run deploy:production
```

#### Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
npm run build
vercel --prod

# Or use environment variable
export VERCEL_PROJECT_ID=your-project-id
npm run deploy:production
```

#### AWS S3 + CloudFront
```bash
# Set environment variables
export AWS_S3_PRODUCTION_BUCKET=your-production-bucket
export AWS_CLOUDFRONT_PRODUCTION_ID=your-distribution-id

# Deploy
npm run deploy:production
```

### 2. Container Deployment

#### Docker
```bash
# Build image
npm run docker:build

# Run container
npm run docker:run

# Or use Docker Compose
npm run docker:compose:up
```

#### Kubernetes
```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: your-registry/employee-management-frontend:latest
        ports:
        - containerPort: 80
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
---
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
spec:
  selector:
    app: frontend
  ports:
  - port: 80
    targetPort: 80
  type: LoadBalancer
```

Deploy to Kubernetes:
```bash
kubectl apply -f k8s-deployment.yaml
```

### 3. Traditional Server Deployment

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    root /var/www/html;
    index index.html;
    
    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Serve static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## CI/CD Pipeline

### GitHub Actions Example
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test:coverage
      - run: npm run test:e2e

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run build:production
        env:
          VITE_API_BASE_URL: ${{ secrets.API_BASE_URL }}
          VITE_WS_URL: ${{ secrets.WS_URL }}
      
      - uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v3
      - uses: actions/download-artifact@v3
        with:
          name: dist
          path: dist/
      
      - name: Deploy to S3
        run: |
          aws s3 sync dist/ s3://${{ secrets.S3_BUCKET }} --delete
          aws cloudfront create-invalidation --distribution-id ${{ secrets.CLOUDFRONT_ID }} --paths "/*"
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

## Security Considerations

### Content Security Policy (CSP)
The application includes a comprehensive CSP configuration in `src/config/security.ts`. Customize based on your requirements:

```typescript
const CSP = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "https://cdn.jsdelivr.net"],
  'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  'connect-src': ["'self'", "https://api.yourcompany.com"],
  // ... other directives
};
```

### HTTPS Configuration
Always use HTTPS in production:
- Obtain SSL certificates (Let's Encrypt recommended)
- Configure HSTS headers
- Redirect HTTP to HTTPS

### Environment Variables Security
- Never commit `.env` files to version control
- Use CI/CD secrets for sensitive values
- Validate environment variables at build time

## Performance Optimization

### Bundle Optimization
- Code splitting is configured in `vite.config.ts`
- Vendor libraries are separated into chunks
- Assets are optimized and compressed

### Caching Strategy
```nginx
# Static assets - long cache
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# HTML files - no cache
location ~* \.html$ {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

### CDN Configuration
Configure your CDN to:
- Cache static assets for 1 year
- Cache HTML files for 5 minutes
- Enable Brotli/Gzip compression
- Set proper cache headers

## Monitoring and Logging

### Health Checks
The application includes health check endpoints:
- `/health` - Basic health check
- Build info available at `/build-info.json`

### Error Monitoring
Configure Sentry for error tracking:
```typescript
// In main.tsx
import * as Sentry from '@sentry/react';

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_APP_ENV,
  });
}
```

### Analytics
Configure Google Analytics:
```typescript
// In main.tsx
if (import.meta.env.VITE_GA_TRACKING_ID) {
  // Initialize GA
}
```

## Rollback Strategy

### Blue-Green Deployment
1. Deploy to staging environment
2. Run smoke tests
3. Switch traffic to new version
4. Keep old version for quick rollback

### Database Migrations
- Ensure backward compatibility
- Test migrations in staging
- Have rollback scripts ready

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run type-check

# Check for linting errors
npm run lint
```

#### Runtime Errors
```bash
# Check browser console for errors
# Verify environment variables
# Check network requests in DevTools
# Review error monitoring dashboard
```

#### Performance Issues
```bash
# Analyze bundle size
npm run analyze

# Check lighthouse scores
npx lighthouse http://localhost:3000

# Monitor Core Web Vitals
```

### Debug Commands
```bash
# Health check
npm run health:check

# Security audit
npm run security:audit

# Bundle analysis
npm run analyze

# Performance testing
npm run test:performance
```

## Deployment Checklist

### Pre-deployment
- [ ] All tests passing
- [ ] Security audit clean
- [ ] Bundle size within limits
- [ ] Environment variables configured
- [ ] SSL certificates valid
- [ ] Backup current version

### Deployment
- [ ] Build successful
- [ ] Health checks passing
- [ ] Smoke tests completed
- [ ] Performance metrics acceptable
- [ ] Error rates normal

### Post-deployment
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify all features working
- [ ] Update documentation
- [ ] Notify stakeholders

## Support and Maintenance

### Regular Tasks
- Update dependencies monthly
- Review security advisories
- Monitor performance metrics
- Update SSL certificates
- Review and rotate secrets

### Emergency Procedures
- Rollback process documented
- Emergency contacts available
- Monitoring alerts configured
- Incident response plan ready

For additional support, contact the development team or refer to the project documentation.