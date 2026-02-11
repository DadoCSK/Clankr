#!/usr/bin/env node
/**
 * Run a migration file using the project's pg connection.
 * Usage: node scripts/run-migration.js migrations/002_social_layer.sql
 */

require('dotenv').config();
const { readFileSync } = require('fs');
const { resolve } = require('path');
const { Pool } = require('pg');

async function run() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node scripts/run-migration.js <migration-file>');
    console.error('Example: node scripts/run-migration.js migrations/002_social_layer.sql');
    process.exit(1);
  }

  const path = resolve(process.cwd(), file);
  let sql;
  try {
    sql = readFileSync(path, 'utf8');
  } catch (e) {
    console.error('Could not read file:', path);
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await pool.query(sql);
    console.log('Migration OK:', file);
  } catch (e) {
    console.error('Migration failed:', e.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
