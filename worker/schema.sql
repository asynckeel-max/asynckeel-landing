-- AsyncKeel waitlist D1 schema
-- Run: npx wrangler d1 execute asynckeel_waitlist --file ./schema.sql

CREATE TABLE IF NOT EXISTS waitlist (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  email     TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  created_at TEXT   NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist (email);
