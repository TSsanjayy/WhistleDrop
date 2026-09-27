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

db.exec(`
  CREATE TABLE IF NOT EXISTS report_replies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
  );
`);

// Migration: file attachment columns (replaces evidence link with upload).
// evidence_url is kept for backward compatibility with old reports.
for (const { name, ddl } of [
  { name: "attachment_path", ddl: "ALTER TABLE reports ADD COLUMN attachment_path TEXT" },
  { name: "attachment_name", ddl: "ALTER TABLE reports ADD COLUMN attachment_name TEXT" },
  { name: "attachment_mimetype", ddl: "ALTER TABLE reports ADD COLUMN attachment_mimetype TEXT" },
  {
    name: "evidence_upload_enabled",
    ddl: "ALTER TABLE reports ADD COLUMN evidence_upload_enabled INTEGER NOT NULL DEFAULT 0"
  },
]) {
  const exists = db.prepare(`SELECT name FROM pragma_table_info('reports') WHERE name = ?`).get(name);
  if (!exists) db.exec(ddl);
}

// Evidence uploads table: multiple files per report, independent of single attachment.
db.exec(`
  CREATE TABLE IF NOT EXISTS report_evidence (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_mimetype TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (report_id) REFERENCES reports(id)
  )
`);

// Evidence requests table: moderator requests for additional evidence.
db.exec(`
  CREATE TABLE IF NOT EXISTS evidence_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (report_id) REFERENCES reports(id)
  )
`);

module.exports = db;