
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'influencers.db');

// Ensure the directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbPath);

// Enable WAL mode for better performance and concurrency
// db.pragma('journal_mode = WAL');

const createTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS cities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS creators (
      id TEXT PRIMARY KEY,
      city_id INTEGER,
      username TEXT,
      full_name TEXT,
      biography TEXT,
      followers_count INTEGER,
      posts_count INTEGER,
      engagement_rate REAL,
      connector TEXT,
      location_country TEXT,
      location_city TEXT,
      profile_pic_url TEXT,
      category TEXT,
      FOREIGN KEY (city_id) REFERENCES cities (id)
    );
  `);
};

createTables();
