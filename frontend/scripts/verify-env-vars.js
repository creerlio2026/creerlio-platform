/**
 * Environment Variables Verification Script
 * 
 * This script checks if required environment variables are set correctly.
 * Run this locally to verify your .env.local file, or use it as a reference
 * for what Vercel needs.
 * 
 * Usage:
 *   node scripts/verify-env-vars.js
 */

const requiredVars = [
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    description: 'Supabase project URL',
    format: (val) => {
      if (!val) return { valid: false, error: 'Missing' };
      if (!val.startsWith('https://')) return { valid: false, error: 'Must start with https://' };
      if (!val.includes('.supabase.co')) return { valid: false, error: 'Must contain .supabase.co' };
      if (val.endsWith('/')) return { valid: false, error: 'Should not have trailing slash' };
      return { valid: true };
    }
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    description: 'Supabase anon/public key',
    format: (val) => {
      if (!val) return { valid: false, error: 'Missing' };
      if (!val.startsWith('eyJ')) return { valid: false, error: 'Should start with eyJ (JWT format)' };
      if (val.length < 100) return { valid: false, error: 'Too short (should be 200+ characters)' };
      if (val.includes('service_role')) return { valid: false, error: 'Should be anon key, not service_role' };
      return { valid: true };
    }
  }
];

const optionalVars = [
  {
    name: 'NEXT_PUBLIC_MAPBOX_TOKEN',
    description: 'Mapbox access token (optional, has fallback)',
    format: (val) => {
      if (!val) return { valid: true, warning: 'Not set (will use fallback)' };
      if (!val.startsWith('pk.')) return { valid: false, error: 'Should start with pk.' };
      return { valid: true };
    }
  },
  {
    name: 'NEXT_PUBLIC_BACKEND_URL',
    description: 'Backend API URL (optional, defaults to localhost)',
    format: (val) => {
      if (!val) return { valid: true, warning: 'Not set (will use localhost:8000)' };
      if (!val.startsWith('http://') && !val.startsWith('https://')) {
        return { valid: false, error: 'Must start with http:// or https://' };
      }
      return { valid: true };
    }
  }
];

console.log('🔍 Environment Variables Verification\n');
console.log('=' .repeat(60));

let hasErrors = false;
let hasWarnings = false;

// Check required variables
console.log('\n📋 Required Variables:\n');
requiredVars.forEach(({ name, description, format }) => {
  const value = process.env[name];
  const result = format(value);
  
  if (!result.valid) {
    hasErrors = true;
    console.log(`❌ ${name}`);
    console.log(`   Description: ${description}`);
    console.log(`   Status: ${result.error}`);
    console.log(`   Value: ${value ? `${value.substring(0, 20)}...` : '(not set)'}`);
  } else {
    console.log(`✅ ${name}`);
    console.log(`   Description: ${description}`);
    console.log(`   Status: Valid`);
    console.log(`   Value: ${value ? `${value.substring(0, 20)}...` : '(not set)'}`);
  }
  console.log('');
});

// Check optional variables
console.log('\n📋 Optional Variables:\n');
optionalVars.forEach(({ name, description, format }) => {
  const value = process.env[name];
  const result = format(value);
  
  if (!result.valid) {
    hasErrors = true;
    console.log(`❌ ${name}`);
    console.log(`   Description: ${description}`);
    console.log(`   Status: ${result.error}`);
  } else if (result.warning) {
    hasWarnings = true;
    console.log(`⚠️  ${name}`);
    console.log(`   Description: ${description}`);
    console.log(`   Status: ${result.warning}`);
  } else {
    console.log(`✅ ${name}`);
    console.log(`   Description: ${description}`);
    console.log(`   Status: Valid`);
  }
  console.log('');
});

// Summary
console.log('=' .repeat(60));
if (hasErrors) {
  console.log('\n❌ ERRORS FOUND: Some required variables are missing or invalid.');
  console.log('   Fix these before deploying to Vercel.\n');
  process.exit(1);
} else if (hasWarnings) {
  console.log('\n⚠️  WARNINGS: Some optional variables are not set.');
  console.log('   These have fallbacks, but you may want to set them for production.\n');
  process.exit(0);
} else {
  console.log('\n✅ ALL CHECKS PASSED: Environment variables are correctly configured!\n');
  process.exit(0);
}
