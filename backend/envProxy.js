// ─── envProxy.js ────────────────────────────────────────────
// Centralized environment variable manager.
// All secrets are loaded here and NEVER exposed to the frontend.
// Frontend calls /api/proxy/* routes which use these internally.
// ─────────────────────────────────────────────────────────────

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const env = {
  // Server
  PORT: process.env.PORT || 4000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Turso Database
  TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL || '',
  TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN || '',

  // Discord
  DISCORD_TOKEN: process.env.DISCORD_TOKEN || '',
  ALERT_CHANNEL_ID: process.env.ALERT_CHANNEL_ID || '',

  // Groq LLM
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',

  // imgbb
  IMGBB_API_KEY: process.env.IMGBB_API_KEY || '',
};

/**
 * Get an environment variable safely.
 * @param {string} key - The env variable name
 * @returns {string} The value
 * @throws {Error} If the key is not found and is required
 */
function get(key) {
  return env[key] || '';
}

/**
 * Check if all critical env vars are set.
 * Logs warnings for missing vars instead of crashing.
 */
function validate() {
  const warnings = [];
  if (!env.TURSO_DATABASE_URL) warnings.push('TURSO_DATABASE_URL is not set — using in-memory fallback');
  if (!env.DISCORD_TOKEN) warnings.push('DISCORD_TOKEN is not set — Discord bot will not start');
  if (!env.GROQ_API_KEY) warnings.push('GROQ_API_KEY is not set — LLM responses disabled, using fallback');
  if (!env.IMGBB_API_KEY) warnings.push('IMGBB_API_KEY is not set — image proxy disabled');

  if (warnings.length > 0) {
    console.log('\n⚠️  Environment Warnings:');
    warnings.forEach(w => console.log(`   • ${w}`));
    console.log('');
  }
  return warnings;
}

module.exports = { get, validate, env };
