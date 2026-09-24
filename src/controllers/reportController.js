const crypto = require("crypto");
const bcrypt = require("bcrypt");

const reportModel = require("../models/reportModel");

const ALLOWED_CATEGORIES = [
  "Security",
  "Harassment",
  "Fraud",
  "Other"
];

async function createReport(req, res, next) {
  try {
    const { category, description, evidence_url } = req.body;

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

    if (
      evidence_url !== undefined &&
      evidence_url !== null &&
      typeof evidence_url !== "string"
    ) {
      return res.status(400).json({
        error: "evidence_url must be a string"
      });
    }

    const caseCode = crypto.randomBytes(24).toString("hex");
    const caseCodeHash = await bcrypt.hash(caseCode, 12);

    const result = reportModel.createReport.run(
      caseCodeHash,
      category,
      description.trim(),
      evidence_url || null
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

    const reports = reportModel.findAllReports.all();

    for (const report of reports) {
      const match = await bcrypt.compare(
        caseCode,
        report.case_code_hash
      );

      if (match) {
        const updates = reportModel.findStatusUpdates.all(report.id);

        return res.json({
          status: report.status,
          status_updates: updates
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
  getReportByCaseCode
};