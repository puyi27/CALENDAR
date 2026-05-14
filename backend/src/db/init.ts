import { pool } from './pool.js';

export const initializeDatabase = async () => {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS departments (name VARCHAR(255) PRIMARY KEY, webhook_url TEXT);`);
    await pool.query(`ALTER TABLE departments ADD COLUMN IF NOT EXISTS default_category_id INT;`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS default_category_id INT;`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS calendar_token VARCHAR(255) UNIQUE;`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS can_work_weekends BOOLEAN DEFAULT FALSE;`);
    await pool.query(`CREATE TABLE IF NOT EXISTS holidays (date DATE PRIMARY KEY, name_holiday VARCHAR(255));`);
    try { await pool.query(`ALTER TABLE holidays RENAME COLUMN name TO name_holiday;`); } catch(e) {}
    await pool.query(`UPDATE users SET calendar_token = md5(random()::text || clock_timestamp()::text) WHERE calendar_token IS NULL;`);
    await pool.query(`INSERT INTO departments (name) SELECT DISTINCT department FROM users WHERE department IS NOT NULL AND department != '' ON CONFLICT (name) DO NOTHING;`);
    console.log("Database initialized successfully.");
  } catch (error) {
    console.error("DB Error:", error);
  }
};
