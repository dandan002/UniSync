#!/usr/bin/env node

/**
 * Setup Checker for UniSync
 * This script checks if all required dependencies and configurations are in place
 */

const fs = require('fs');
const { execSync } = require('child_process');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

function log(message, color = RESET) {
  console.log(`${color}${message}${RESET}`);
}

function checkCommand(command, name) {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });
    log(`✓ ${name} is installed`, GREEN);
    return true;
  } catch {
    log(`✗ ${name} is NOT installed`, RED);
    return false;
  }
}

function checkFile(file, name) {
  if (fs.existsSync(file)) {
    log(`✓ ${name} exists`, GREEN);
    return true;
  } else {
    log(`✗ ${name} does NOT exist`, RED);
    return false;
  }
}

function checkEnvVar(varName) {
  const envContent = fs.readFileSync('.env', 'utf8');
  const regex = new RegExp(`^${varName}=.+$`, 'm');

  if (regex.test(envContent)) {
    const value = envContent.match(regex)[0].split('=')[1];
    if (value && value.length > 0 && !value.includes('your-') && !value.includes('username')) {
      log(`✓ ${varName} is set`, GREEN);
      return true;
    }
  }

  log(`✗ ${varName} is NOT set or uses default value`, YELLOW);
  return false;
}

console.log('\n🔍 Checking UniSync Setup...\n');

// Check Node.js version
try {
  const nodeVersion = execSync('node --version').toString().trim();
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  if (majorVersion >= 18) {
    log(`✓ Node.js ${nodeVersion} (requirement: 18+)`, GREEN);
  } else {
    log(`✗ Node.js ${nodeVersion} is too old (requirement: 18+)`, RED);
  }
} catch {
  log('✗ Node.js is NOT installed', RED);
}

// Check PostgreSQL
checkCommand('psql', 'PostgreSQL');

// Check LaTeX (optional but recommended)
const hasXelatex = checkCommand('xelatex', 'XeLaTeX');
const hasPdflatex = checkCommand('pdflatex', 'pdfLaTeX');

if (!hasXelatex && !hasPdflatex) {
  log('  ⚠ LaTeX is required for resume PDF generation', YELLOW);
}

// Check files
console.log('\n📁 Checking required files...\n');
checkFile('.env', '.env configuration file');
checkFile('prisma/schema.prisma', 'Prisma schema');
checkFile('node_modules', 'node_modules (run npm install)');

// Check environment variables
if (fs.existsSync('.env')) {
  console.log('\n🔐 Checking environment variables...\n');

  const requiredVars = [
    'DATABASE_URL',
    'AUTH0_SECRET',
    'AUTH0_BASE_URL',
    'AUTH0_ISSUER_BASE_URL',
    'AUTH0_CLIENT_ID',
    'AUTH0_CLIENT_SECRET'
  ];

  const optionalVars = [
    'SMTP_HOST',
    'SMTP_USER',
    'SMTP_PASSWORD'
  ];

  let allRequired = true;
  requiredVars.forEach(varName => {
    if (!checkEnvVar(varName)) {
      allRequired = false;
    }
  });

  console.log('\n📧 Optional Email Configuration:\n');
  optionalVars.forEach(varName => {
    checkEnvVar(varName);
  });

  if (!allRequired) {
    log('\n⚠ Some required environment variables are not configured', YELLOW);
    log('  Copy .env.example to .env and fill in your values', YELLOW);
  }
} else {
  log('\n⚠ .env file not found. Copy .env.example to .env', YELLOW);
}

// Check Prisma Client
console.log('\n🗄️  Checking Prisma...\n');
if (fs.existsSync('node_modules/.prisma/client')) {
  log('✓ Prisma Client is generated', GREEN);
} else {
  log('✗ Prisma Client is NOT generated. Run: npx prisma generate', RED);
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('\n📋 Setup Summary:\n');
log('1. Install dependencies: npm install', GREEN);
log('2. Copy environment file: cp .env.example .env', GREEN);
log('3. Configure Auth0 (see README.md)', YELLOW);
log('4. Setup database: createdb unisync', YELLOW);
log('5. Generate Prisma Client: npx prisma generate', YELLOW);
log('6. Run migrations: npx prisma migrate dev --name init', YELLOW);
log('7. Start development server: npm run dev', GREEN);
console.log('\n' + '='.repeat(50) + '\n');
