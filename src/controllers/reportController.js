const crypto = require("crypto");
const bcrypt = require("bcrypt");

const reportModel = require("../models/reportModel");

const ALLOWED_CATEGORIES = [
  "Security",
  "Harassment",
  "Corruption",
  "Technical",
  "Other"
];

async function createReport(req, res, next) {
  try {
    // Supports both JSON { category, description, evidence_url } and
    // multipart/form-data with `attachment` file and/or `evidence_url` field.
    const { category, description } = req.body;
    let { evidence_url } = req.body;

    if (!category || !description) {
      return res.status(400).json({
        error: "category and description are required"
      });
    }

    if (!ALLOWED_CATEGORIES.includes(category)) {
      return res.status(400).json({
        error: "Invalid category"
      });
    }

    if (typeof description !== "string" || description.trim() === "") {
      return res.status(400).json({
        error: "description must be a non-empty string"
      });
    }

    if (evidence_url !== undefined && evidence_url !== null && evidence_url !== "") {
      if (typeof evidence_url !== "string") {
        return res.status(400).json({
          error: "evidence_url must be a string"
        });
      }
      evidence_url = evidence_url.trim();
      let parsed;
      try {
        parsed = new URL(evidence_url);
      } catch {
        return res.status(400).json({
          error: "evidence_url must be a valid http(s) URL"
        });
      }
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return res.status(400).json({
          error: "evidence_url must be a valid http(s) URL"
        });
      }
    } else {
      evidence_url = null;
    }

    const attachment = req.file
      ? {
          path: req.file.path,
          name: req.file.originalname,
          mimetype: req.file.mimetype,
        }
      : null;

    const caseCode = crypto.randomBytes(24).toString("hex");
    const caseCodeHash = await bcrypt.hash(caseCode, 12);

    const result = reportModel.createReport.run(
      caseCodeHash,
      category,
      description.trim(),
      evidence_url,
      attachment?.path || null,
      attachment?.name || null,
      attachment?.mimetype || null
    );

    res.status(201).json({
      message: "Report submitted successfully",
      case_code: caseCode,
      report_id: result.lastInsertRowid
    });
  } catch (error) {
    next(error);
  }
}

async function getReportByCaseCode(req, res, next) {
  try {
    const { caseCode } = req.params;

    if (!caseCode) {
      return res.status(404).json({
        error: "Not found"
      });
    }

    const reports = reportModel.findAllReports();

    for (const report of reports) {
      const match = await bcrypt.compare(
        caseCode,
        report.case_code_hash
      );

      if (match) {
        const updates = reportModel.findStatusUpdates.all(report.id);

        const replies = reportModel.findReportReplies.all(report.id);

        const evidence = reportModel.findEvidenceByReportId.all(report.id);

        const evidenceRequest =
          reportModel.findActiveEvidenceRequest.get(report.id);

        return res.json({
          category: report.category,
          description: report.description,
          status: report.status,
          status_updates: updates,
          replies: replies,
          evidence_upload_enabled: Boolean(
            report.evidence_upload_enabled
          ),
          evidence_request: evidenceRequest
            ? {
                message: evidenceRequest.message,
                created_at: evidenceRequest.created_at
              }
            : null,
          evidence: reportModel.findEvidenceByReportId.all(report.id)
            .map((item) => ({
              id: item.id,
              file_name: item.file_name,
              file_mimetype: item.file_mimetype,
              created_at: item.created_at
            }))
        });
      }
    }

    return res.status(404).json({
      error: "Not found"
    });
  } catch (error) {
    next(error);
  }
}

async function uploadEvidence(req, res, next) {
  try {
    const { caseCode } = req.params;

    if (!caseCode) {
      return res.status(404).json({
        error: "Not found"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: "Evidence file is required"
      });
    }

    const reports = reportModel.findAllReports();

    for (const report of reports) {
      const match = await bcrypt.compare(
        caseCode,
        report.case_code_hash
      );

      if (match) {
        if (!report.evidence_upload_enabled) {
          return res.status(403).json({
            error: "Evidence upload is not enabled for this report"
          });
        }

        const result = reportModel.addEvidence.run(
          report.id,
          req.file.path,
          req.file.originalname,
          req.file.mimetype
        );

        return res.status(201).json({
          message: "Evidence uploaded successfully",
          evidence_id: result.lastInsertRowid
        });
      }
    }

    return res.status(404).json({
      error: "Not found"
    });

  } catch (error) {
    next(error);
  }
}

async function addReportReply(req, res, next) {
  try {
    const { caseCode } = req.params;
    const { message } = req.body;

    if (!caseCode) {
      return res.status(404).json({
        error: "Not found"
      });
    }

    if (typeof message !== "string" || message.trim() === "") {
      return res.status(400).json({
        error: "Reply message is required"
      });
    }

    const reports = reportModel.findAllReports();

    for (const report of reports) {
      const match = await bcrypt.compare(
        caseCode,
        report.case_code_hash
      );

      if (match) {
        const reply = reportModel.addReportReply(
          report.id,
          message.trim()
        );

        return res.status(201).json({
          message: "Reply sent successfully",
          reply: {
            id: reply.id,
            message: reply.message,
            created_at: reply.created_at
          }
        });
      }
    }

    return res.status(404).json({
      error: "Not found"
    });

  } catch (error) {
    next(error);
  }
}

module.exports = {
  createReport,
  getReportByCaseCode,
  uploadEvidence,
  addReportReply
};