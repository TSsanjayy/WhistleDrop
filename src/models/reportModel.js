const db = require("../database");

const createReport = db.prepare(`
  INSERT INTO reports (
    case_code_hash,
    category,
    description,
    evidence_url
  )
  VALUES (?, ?, ?, ?)
`);

const findAllReports = db.prepare(`
  SELECT *
  FROM reports
  ORDER BY created_at DESC
`);

const findReportById = db.prepare(`
  SELECT *
  FROM reports
  WHERE id = ?
`);

const updateReportStatus = db.prepare(`
  UPDATE reports
  SET status = ?
  WHERE id = ?
`);

const addStatusUpdate = db.prepare(`
  INSERT INTO status_updates (
    report_id,
    message,
    status
  )
  VALUES (?, ?, ?)
`);

const findStatusUpdates = db.prepare(`
  SELECT id, message, status, created_at
  FROM status_updates
  WHERE report_id = ?
  ORDER BY created_at ASC
`);

module.exports = {
  createReport,
  findAllReports,
  findReportById,
  updateReportStatus,
  addStatusUpdate,
  findStatusUpdates
};