const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'whistledrop.db');

const db = new Database(DB_PATH);

// Recommended pragma for a single-file app server
db.pragma('journal_mode = WAL');

// Reports table: one row per submitted report.
// No column here ever stores who submitted it (no IP, no user_id, no session).
db.exec(`
  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_code_hash TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    evidence_url TEXT,
    status TEXT NOT NULL DEFAULT 'SUBMITTED',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// Status updates table: moderator notes tied to a report, not to a person.
db.exec(`
  CREATE TABLE IF NOT EXISTS status_updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id INTEGER NOT NULL,
    message TEXT,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (report_id) REFERENCES reports(id)
  )
`);

module.exports = db;