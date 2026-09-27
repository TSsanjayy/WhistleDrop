const db = require("../database");

const createReport = db.prepare(`
  INSERT INTO reports (
    case_code_hash,
    category,
    description,
    evidence_url,
    attachment_path,
    attachment_name,
    attachment_mimetype
  )
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

function findAllReports(filters = {}) {
  let query = `
    SELECT
      id,
      category,
      description,
      evidence_url,
      status,
      created_at,
      case_code_hash,
      evidence_upload_enabled,
      attachment_path
    FROM reports
  `;

  const params = [];
  const conditions = [];

  if (filters.status) {
    conditions.push("status = ?");
    params.push(filters.status);
  }

  if (filters.category) {
    conditions.push("category = ?");
    params.push(filters.category);
  }

  if (conditions.length) {
    query += " WHERE " + conditions.join(" AND ");
  }

  query += " ORDER BY datetime(created_at) DESC";

  const reports = db.prepare(query).all(...params);

  return reports.map(report => ({
    ...report,
    status_updates: findStatusUpdates.all(report.id),
    replies: findReportReplies.all(report.id)
  }));
}

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

const setEvidenceUploadAccess = db.prepare(`
  UPDATE reports
  SET evidence_upload_enabled = ?
  WHERE id = ?
`);

const addEvidence = db.prepare(`
  INSERT INTO report_evidence (
    report_id,
    file_path,
    file_name,
    file_mimetype
  )
  VALUES (?, ?, ?, ?)
`);

const findEvidenceByReportId = db.prepare(`
  SELECT id, file_name, file_mimetype, created_at
  FROM report_evidence
  WHERE report_id = ?
  ORDER BY created_at ASC
`);

const findEvidenceById = db.prepare(`
  SELECT *
  FROM report_evidence
  WHERE id = ?
`);

const createEvidenceRequest = db.prepare(`
  INSERT INTO evidence_requests (
    report_id,
    message,
    active
  )
  VALUES (?, ?, 1)
`);

const findActiveEvidenceRequest = db.prepare(`
  SELECT id, message, created_at
  FROM evidence_requests
  WHERE report_id = ? AND active = 1
  ORDER BY created_at DESC
  LIMIT 1
`);

const disableEvidenceRequest = db.prepare(`
  UPDATE evidence_requests
  SET active = 0
  WHERE report_id = ?
`);

function addReportReply(reportId, message) {
  const stmt = db.prepare(`
    INSERT INTO report_replies (report_id, message)
    VALUES (?, ?)
  `);

  const result = stmt.run(reportId, message);

  return db.prepare(`
    SELECT id, report_id, message, created_at
    FROM report_replies
    WHERE id = ?
  `).get(result.lastInsertRowid);
}

const findReportReplies = db.prepare(`
  SELECT id, report_id, message, created_at
  FROM report_replies
  WHERE report_id = ?
  ORDER BY created_at ASC
`);

function deleteReport(reportId) {
  const transaction = db.transaction((id) => {
    db.prepare(`
      DELETE FROM report_replies
      WHERE report_id = ?
    `).run(id);

    db.prepare(`
      DELETE FROM status_updates
      WHERE report_id = ?
    `).run(id);

    db.prepare(`
      DELETE FROM report_evidence
      WHERE report_id = ?
    `).run(id);

    db.prepare(`
      DELETE FROM evidence_requests
      WHERE report_id = ?
    `).run(id);

    const result = db.prepare(`
      DELETE FROM reports
      WHERE id = ?
    `).run(id);

    return result.changes;
  });

  return transaction(reportId);
}

module.exports = {
  createReport,
  findAllReports,
  findReportById,
  updateReportStatus,
  addStatusUpdate,
  findStatusUpdates,
  setEvidenceUploadAccess,
  addEvidence,
  findEvidenceByReportId,
  findEvidenceById,
  createEvidenceRequest,
  findActiveEvidenceRequest,
  disableEvidenceRequest,
  addReportReply,
  findReportReplies,
  deleteReport
};