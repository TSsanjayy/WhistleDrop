const express = require("express");
const moderatorAuth = require("../middleware/auth");
const reportModel = require("../models/reportModel");

const router = express.Router();

router.use(moderatorAuth);

// GET /moderator/reports
router.get("/reports", (req, res, next) => {
  try {
    const { status, category } = req.query;

    let reports = reportModel.findAllReports.all();

    if (status) {
      reports = reports.filter((report) => report.status === status);
    }

    if (category) {
      reports = reports.filter((report) => report.category === category);
    }

    // Never expose the case-code hash to moderators through the API
    reports = reports.map(
      ({ case_code_hash, ...report }) => report
    );

    res.json(reports);
  } catch (error) {
    next(error);
  }
});

// PATCH /moderator/reports/:id/status
router.patch("/reports/:id/status", (req, res, next) => {
  try {
    const reportId = Number(req.params.id);
    const { status, note } = req.body;

    const allowedStatuses = [
      "SUBMITTED",
      "UNDER_REVIEW",
      "RESOLVED",
      "DISMISSED"
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid status"
      });
    }

    const report = reportModel.findReportById.get(reportId);

    if (!report) {
      return res.status(404).json({
        error: "Report not found"
      });
    }

    const validTransitions = {
      SUBMITTED: ["UNDER_REVIEW"],
      UNDER_REVIEW: ["RESOLVED", "DISMISSED"],
      RESOLVED: [],
      DISMISSED: []
    };

    if (!validTransitions[report.status].includes(status)) {
      return res.status(409).json({
        error: `Invalid status transition from ${report.status} to ${status}`
      });
    }

    reportModel.updateReportStatus.run(status, reportId);

    if (note) {
      reportModel.addStatusUpdate.run(
        reportId,
        note,
        status
      );
    }

    res.json({
      message: "Report status updated",
      report_id: reportId,
      status
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;