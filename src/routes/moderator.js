const express = require("express");
const fs = require("fs");
const path = require("path");
const moderatorAuth = require("../middleware/auth");
const reportModel = require("../models/reportModel");
const {
  updateStatus,
  deleteReportController
} = require("../controllers/moderatorController");

const router = express.Router();

router.use(moderatorAuth);

// GET /moderator/reports
router.get("/reports", (req, res, next) => {
  try {
    const { status, category } = req.query;

    let reports = reportModel.findAllReports();

    if (status) {
      reports = reports.filter((report) => report.status === status);
    }

    if (category) {
      reports = reports.filter((report) => report.category === category);
    }

    // Never expose the case-code hash or internal disk path to moderators through the API
    reports = reports.map(
      ({ case_code_hash, attachment_path, ...report }) => ({
        ...report,
        has_attachment: Boolean(attachment_path),
      })
    );

    res.json(reports);
  } catch (error) {
    next(error);
  }
});
router.get("/reports/:id", (req, res, next) => {
  try {
    const reportId = Number(req.params.id);

    if (!Number.isInteger(reportId) || reportId <= 0) {
      return res.status(400).json({
        error: "Invalid report ID"
      });
    }

    const report = reportModel.findReportById.get(reportId);

    if (!report) {
      return res.status(404).json({
        error: "Report not found"
      });
    }

    // Never expose the case-code hash or internal disk path
    const { case_code_hash, attachment_path, ...safeReport } = report;

    const statusUpdates =
      reportModel.findStatusUpdates.all(reportId);

    res.json({
      ...safeReport,
      has_attachment: Boolean(attachment_path),
      status_updates: statusUpdates
    });

  } catch (error) {
    next(error);
  }
});

// GET /moderator/reports/:id/attachment — moderator-only file download
router.get("/reports/:id/attachment", (req, res, next) => {
  try {
    const reportId = Number(req.params.id);

    if (!Number.isInteger(reportId) || reportId <= 0) {
      return res.status(400).json({
        error: "Invalid report ID"
      });
    }

    const report = reportModel.findReportById.get(reportId);

    if (!report || !report.attachment_path) {
      return res.status(404).json({
        error: "Attachment not found"
      });
    }

    const resolved = path.resolve(report.attachment_path);
    const uploadsRoot = path.resolve(path.join(__dirname, "..", "..", "uploads"));
    if (!resolved.startsWith(uploadsRoot) || !fs.existsSync(resolved)) {
      return res.status(404).json({
        error: "Attachment not found"
      });
    }

    res.download(resolved, report.attachment_name || "attachment");
  } catch (error) {
    next(error);
  }
});

router.patch(
  "/reports/:id/status",
  updateStatus
);

router.delete(
  "/reports/:id",
  deleteReportController
);

// PATCH /moderator/reports/:id/evidence-access
router.patch("/reports/:id/evidence-access", (req, res, next) => {
  try {
    const reportId = Number(req.params.id);
    const { enabled, message } = req.body;

    if (!Number.isInteger(reportId) || reportId <= 0) {
      return res.status(400).json({
        error: "Invalid report ID"
      });
    }

    if (typeof enabled !== "boolean") {
      return res.status(400).json({
        error: "enabled must be true or false"
      });
    }

    const report = reportModel.findReportById.get(reportId);

    if (!report) {
      return res.status(404).json({
        error: "Report not found"
      });
    }

    if (enabled) {
      if (!message || typeof message !== "string" || !message.trim()) {
        return res.status(400).json({
          error: "A request message is required when enabling evidence upload"
        });
      }

      reportModel.createEvidenceRequest.run(
        reportId,
        message.trim()
      );

      reportModel.setEvidenceUploadAccess.run(
        1,
        reportId
      );

    } else {
      reportModel.setEvidenceUploadAccess.run(
        0,
        reportId
      );

      reportModel.disableEvidenceRequest.run(reportId);
    }

    res.json({
      message: enabled
        ? "Evidence request sent and upload enabled"
        : "Evidence upload disabled",
      report_id: reportId,
      evidence_upload_enabled: enabled
    });

  } catch (error) {
    next(error);
  }
});
 
// GET /moderator/reports/:id/evidence
router.get("/reports/:id/evidence", (req, res, next) => {
  try {
    const reportId = Number(req.params.id);
 
    if (!Number.isInteger(reportId) || reportId <= 0) {
      return res.status(400).json({
        error: "Invalid report ID"
      });
    }
 
    const report = reportModel.findReportById.get(reportId);
 
    if (!report) {
      return res.status(404).json({
        error: "Report not found"
      });
    }
 
    const evidence = reportModel.findEvidenceByReportId.all(reportId);
 
    res.json(evidence);
  } catch (error) {
    next(error);
  }
});
 
// GET /moderator/reports/:id/evidence/:evidenceId
router.get(
  "/reports/:id/evidence/:evidenceId",
  (req, res, next) => {
    try {
      const reportId = Number(req.params.id);
      const evidenceId = Number(req.params.evidenceId);
 
      if (
        !Number.isInteger(reportId) ||
        reportId <= 0 ||
        !Number.isInteger(evidenceId) ||
        evidenceId <= 0
      ) {
        return res.status(400).json({
          error: "Invalid ID"
        });
      }
 
      const evidence = reportModel.findEvidenceById.get(evidenceId);
 
      if (!evidence || evidence.report_id !== reportId) {
        return res.status(404).json({
          error: "Evidence not found"
        });
      }
 
      const resolved = path.resolve(evidence.file_path);
 
      const uploadsRoot = path.resolve(
        path.join(__dirname, "..", "..", "uploads")
      );
 
      if (
        !resolved.startsWith(uploadsRoot) ||
        !fs.existsSync(resolved)
      ) {
        return res.status(404).json({
          error: "Evidence file not found"
        });
      }
 
      res.download(
        resolved,
        evidence.file_name || "evidence"
      );
 
    } catch (error) {
      next(error);
    }
  }
);
 
module.exports = router;