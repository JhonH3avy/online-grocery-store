/**
 * Environment Variables Validation Script
 * 
 * Checks that all required environment variables are present
 */

const fs = require('fs');
const path = require('path');

const requiredVars = [
  'VITE_API_BASE_URL',
  'VITE_APP_NAME',
];

const optionalVars = [
  'VITE_ENABLE_ANALYTICS',
  'VITE_ENABLE_DEBUG',
  'VITE_STRIPE_PUBLIC_KEY',
  'VITE_GOOGLE_MAPS_API_KEY',
];

function checkEnvFile(envPath) {
  if (!fs.existsSync(envPath)) {
    console.warn(`⚠️  Environment file not found: ${envPath}`);
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const envVars = envContent
    .split('\n')
    .filter(line => line.trim() && !line.startsWith('#'))
    .map(line => line.split('=')[0].trim());

  console.log(`📋 Checking environment file: ${envPath}`);
  
  let isValid = true;
  
  // Check required variables
  for (const requiredVar of requiredVars) {
    if (!envVars.includes(requiredVar)) {
      console.error(`❌ Missing required variable: ${requiredVar}`);
      isValid = false;
    } else {
      console.log(`✅ ${requiredVar}`);
    }
  }
  
  // Check optional variables
  for (const optionalVar of optionalVars) {
    if (envVars.includes(optionalVar)) {
      console.log(`✅ ${optionalVar} (optional)`);
    } else {
      console.log(`⚪ ${optionalVar} (optional, not set)`);
    }
  }
  
  return isValid;
}

function main() {
  console.log('🔍 Environment Variables Validation\n');
  
  const envFiles = [
    '.env.development',
    '.env.production',
    '.env.local',
  ];
  
  let allValid = true;
  
  for (const envFile of envFiles) {
    const envPath = path.join(__dirname, '..', envFile);
    const isValid = checkEnvFile(envPath);
    allValid = allValid && isValid;
    console.log('');
  }
  
  if (allValid) {
    console.log('🎉 All environment files are valid!');
    process.exit(0);
  } else {
    console.log('❌ Some environment files have issues. Please fix them before deploying.');
    process.exit(1);
  }
}

main();
