import pg from 'pg';
import { config } from './config.js';

const { Pool } = pg;

let pool;

export function getPool() {
  if (!pool) {
    const useSsl = String(config.db.sslMode || '').toLowerCase() !== 'disable';

    pool = new Pool({
      connectionString: config.db.connectionString,
      ssl: useSsl ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    });
  }

  return pool;
}
