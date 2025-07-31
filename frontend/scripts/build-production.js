#!/usr/bin/env node

/**
 * Production build script with optimizations and validation
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('🚀 Starting production build...\n');

// Step 1: Clean previous build
console.log('1. Cleaning previous build...');
try {
  execSync('rm -rf dist', { cwd: rootDir, stdio: 'inherit' });
  console.log('✅ Previous build cleaned\n');
} catch (error) {
  console.log('⚠️  No previous build to clean\n');
}

// Step 2: Run type checking
console.log('2. Running TypeScript type checking...');
try {
  execSync('npm run type-check', { cwd: rootDir, stdio: 'inherit' });
  console.log('✅ Type checking passed\n');
} catch (error) {
  console.error('❌ Type checking failed');
  process.exit(1);
}

// Step 3: Run linting
console.log('3. Running ESLint...');
try {
  execSync('npm run lint', { cwd: rootDir, stdio: 'inherit' });
  console.log('✅ Linting passed\n');
} catch (error) {
  console.error('❌ Linting failed');
  process.exit(1);
}

// Step 4: Run tests
console.log('4. Running tests...');
try {
  execSync('npm run test:coverage', { cwd: rootDir, stdio: 'inherit' });
  console.log('✅ Tests passed\n');
} catch (error) {
  console.error('❌ Tests failed');
  process.exit(1);
}

// Step 5: Build for production
console.log('5. Building for production...');
try {
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
  console.log('✅ Production build completed\n');
} catch (error) {
  console.error('❌ Production build failed');
  process.exit(1);
}

// Step 6: Generate build info
console.log('6. Generating build information...');
const buildInfo = {
  version: process.env.npm_package_version || '1.0.0',
  buildTime: new Date().toISOString(),
  gitCommit: process.env.GITHUB_SHA || 'unknown',
  gitBranch: process.env.GITHUB_REF_NAME || 'unknown',
  nodeVersion: process.version,
  environment: 'production',
};

writeFileSync(
  join(rootDir, 'dist', 'build-info.json'),
  JSON.stringify(buildInfo, null, 2)
);
console.log('✅ Build information generated\n');

// Step 7: Validate build output
console.log('7. Validating build output...');
const requiredFiles = [
  'dist/index.html',
  'dist/assets',
  'dist/build-info.json',
];

let validationPassed = true;
for (const file of requiredFiles) {
  const filePath = join(rootDir, file);
  if (!existsSync(filePath)) {
    console.error(`❌ Required file missing: ${file}`);
    validationPassed = false;
  }
}

if (!validationPassed) {
  console.error('❌ Build validation failed');
  process.exit(1);
}

console.log('✅ Build validation passed\n');

// Step 8: Generate bundle analysis (optional)
if (process.env.ANALYZE === 'true') {
  console.log('8. Generating bundle analysis...');
  try {
    execSync('npm run analyze', { cwd: rootDir, stdio: 'inherit' });
    console.log('✅ Bundle analysis generated\n');
  } catch (error) {
    console.log('⚠️  Bundle analysis failed (optional)\n');
  }
}

// Step 9: Security scan (optional)
if (process.env.SECURITY_SCAN === 'true') {
  console.log('9. Running security scan...');
  try {
    execSync('npm audit --audit-level=high', { cwd: rootDir, stdio: 'inherit' });
    console.log('✅ Security scan passed\n');
  } catch (error) {
    console.log('⚠️  Security vulnerabilities found (check npm audit output)\n');
  }
}

console.log('🎉 Production build completed successfully!');
console.log(`📦 Build output: ${join(rootDir, 'dist')}`);
console.log(`📊 Build info: ${JSON.stringify(buildInfo, null, 2)}`);

// Step 10: Display next steps
console.log('\n📋 Next steps:');
console.log('1. Test the build locally: npm run preview');
console.log('2. Deploy to staging: npm run deploy:staging');
console.log('3. Deploy to production: npm run deploy:production');
console.log('4. Monitor deployment: Check your monitoring dashboard');