const Database = require('better-sqlite3');
const path = require('path');

// Keep the database file in the same directory for simplicity
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    amount REAL NOT NULL,
    note TEXT
  );
  CREATE TABLE IF NOT EXISTS pins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pin TEXT UNIQUE NOT NULL
  );
`);

// Try to add user_pin column to the expenses table if it doesn't exist
try {
  // Check if column exists by querying pragma
  const tableInfo = db.prepare("PRAGMA table_info(expenses)").all();
  const hasUserPin = tableInfo.some(col => col.name === 'user_pin');

  if (!hasUserPin) {
    db.exec(`ALTER TABLE expenses Add COLUMN user_pin TEXT DEFAULT '123456'`);
  }
} catch (err) {
  console.error("Error migrating user_pin column:", err);
}

// Insert default pin if pins table is empty
const pinCount = db.prepare('SELECT COUNT(*) as count FROM pins').get();
if (pinCount.count === 0) {
  db.prepare('INSERT INTO pins (pin) VALUES (?)').run('123456');
}

module.exports = db;
