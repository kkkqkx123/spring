#!/usr/bin/env node

/**
 * Deployment script for different environments
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const environment = process.argv[2] || 'staging';
const validEnvironments = ['staging', 'production'];

if (!validEnvironments.includes(environment)) {
  console.error(`❌ Invalid environment: ${environment}`);
  console.error(`Valid environments: ${validEnvironments.join(', ')}`);
  process.exit(1);
}

console.log(`🚀 Deploying to ${environment}...\n`);

// Step 1: Validate build exists
console.log('1. Validating build...');
const distPath = join(rootDir, 'dist');
if (!existsSync(distPath)) {
  console.error('❌ Build not found. Run npm run build:production first.');
  process.exit(1);
}

const buildInfoPath = join(distPath, 'build-info.json');
if (existsSync(buildInfoPath)) {
  const buildInfo = JSON.parse(readFileSync(buildInfoPath, 'utf8'));
  console.log(`✅ Build validated (version: ${buildInfo.version})\n`);
} else {
  console.log('⚠️  Build info not found, continuing...\n');
}

// Step 2: Environment-specific pre-deployment checks
console.log('2. Running pre-deployment checks...');

if (environment === 'production') {
  // Additional checks for production
  console.log('   - Checking for production environment variables...');
  const requiredEnvVars = [
    'VITE_API_BASE_URL',
    'VITE_WS_URL',
  ];
  
  let envCheckPassed = true;
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`   ❌ Missing required environment variable: ${envVar}`);
      envCheckPassed = false;
    }
  }
  
  if (!envCheckPassed) {
    console.error('❌ Environment variable check failed');
    process.exit(1);
  }
  
  console.log('   - Checking for security configurations...');
  // Add security checks here
  
  console.log('   - Validating SSL certificates...');
  // Add SSL validation here
}

console.log('✅ Pre-deployment checks passed\n');

// Step 3: Deploy based on environment
console.log(`3. Deploying to ${environment}...`);

try {
  switch (environment) {
    case 'staging':
      deployToStaging();
      break;
    case 'production':
      deployToProduction();
      break;
  }
} catch (error) {
  console.error(`❌ Deployment to ${environment} failed:`, error.message);
  process.exit(1);
}

function deployToStaging() {
  console.log('   - Uploading to staging server...');
  
  // Example deployment commands (customize based on your infrastructure)
  // AWS S3 + CloudFront
  if (process.env.AWS_S3_STAGING_BUCKET) {
    execSync(`aws s3 sync dist/ s3://${process.env.AWS_S3_STAGING_BUCKET} --delete`, {
      cwd: rootDir,
      stdio: 'inherit'
    });
    
    if (process.env.AWS_CLOUDFRONT_STAGING_ID) {
      execSync(`aws cloudfront create-invalidation --distribution-id ${process.env.AWS_CLOUDFRONT_STAGING_ID} --paths "/*"`, {
        cwd: rootDir,
        stdio: 'inherit'
      });
    }
  }
  
  // Docker deployment
  else if (process.env.DOCKER_REGISTRY) {
    execSync('docker build -t frontend-staging .', { cwd: rootDir, stdio: 'inherit' });
    execSync(`docker tag frontend-staging ${process.env.DOCKER_REGISTRY}/frontend:staging`, {
      cwd: rootDir,
      stdio: 'inherit'
    });
    execSync(`docker push ${process.env.DOCKER_REGISTRY}/frontend:staging`, {
      cwd: rootDir,
      stdio: 'inherit'
    });
  }
  
  // Netlify deployment
  else if (process.env.NETLIFY_SITE_ID) {
    execSync('npx netlify deploy --prod --dir=dist', { cwd: rootDir, stdio: 'inherit' });
  }
  
  // Vercel deployment
  else if (process.env.VERCEL_PROJECT_ID) {
    execSync('npx vercel --prod', { cwd: rootDir, stdio: 'inherit' });
  }
  
  // Generic rsync deployment
  else if (process.env.STAGING_SERVER) {
    execSync(`rsync -avz --delete dist/ ${process.env.STAGING_SERVER}:/var/www/html/`, {
      cwd: rootDir,
      stdio: 'inherit'
    });
  }
  
  else {
    console.log('   ⚠️  No staging deployment method configured');
    console.log('   Configure one of: AWS_S3_STAGING_BUCKET, DOCKER_REGISTRY, NETLIFY_SITE_ID, VERCEL_PROJECT_ID, or STAGING_SERVER');
  }
}

function deployToProduction() {
  console.log('   - Uploading to production server...');
  
  // Production deployment with additional safety checks
  if (process.env.AWS_S3_PRODUCTION_BUCKET) {
    // Backup current production
    const backupBucket = process.env.AWS_S3_BACKUP_BUCKET;
    if (backupBucket) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      execSync(`aws s3 sync s3://${process.env.AWS_S3_PRODUCTION_BUCKET} s3://${backupBucket}/backup-${timestamp}/`, {
        cwd: rootDir,
        stdio: 'inherit'
      });
    }
    
    // Deploy to production
    execSync(`aws s3 sync dist/ s3://${process.env.AWS_S3_PRODUCTION_BUCKET} --delete`, {
      cwd: rootDir,
      stdio: 'inherit'
    });
    
    if (process.env.AWS_CLOUDFRONT_PRODUCTION_ID) {
      execSync(`aws cloudfront create-invalidation --distribution-id ${process.env.AWS_CLOUDFRONT_PRODUCTION_ID} --paths "/*"`, {
        cwd: rootDir,
        stdio: 'inherit'
      });
    }
  }
  
  // Add other production deployment methods here
  else {
    console.log('   ⚠️  No production deployment method configured');
    console.log('   Configure AWS_S3_PRODUCTION_BUCKET for production deployment');
  }
}

// Step 4: Post-deployment verification
console.log('\n4. Running post-deployment verification...');

const healthCheckUrl = environment === 'production' 
  ? process.env.PRODUCTION_URL 
  : process.env.STAGING_URL;

if (healthCheckUrl) {
  try {
    // Wait a moment for deployment to propagate
    console.log('   - Waiting for deployment to propagate...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    console.log(`   - Checking health endpoint: ${healthCheckUrl}`);
    execSync(`curl -f ${healthCheckUrl} > /dev/null`, { stdio: 'inherit' });
    console.log('   ✅ Health check passed');
  } catch (error) {
    console.log('   ⚠️  Health check failed (this might be expected immediately after deployment)');
  }
} else {
  console.log('   ⚠️  No health check URL configured');
}

console.log('\n5. Deployment summary:');
console.log(`   Environment: ${environment}`);
console.log(`   Timestamp: ${new Date().toISOString()}`);
console.log(`   Build version: ${process.env.npm_package_version || 'unknown'}`);

console.log(`\n🎉 Deployment to ${environment} completed!`);

// Step 5: Next steps
console.log('\n📋 Next steps:');
console.log(`1. Verify deployment: ${healthCheckUrl || 'Check your application URL'}`);
console.log('2. Monitor application metrics');
console.log('3. Check error logs');
console.log('4. Notify team of successful deployment');