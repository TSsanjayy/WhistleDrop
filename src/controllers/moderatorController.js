const {
  findAllReports,
  findReportById,
  updateReportStatus,
  deleteReport
} = require("../models/reportModel");

async function deleteReportController(req, res, next) {
  try {
    const reportId = Number(req.params.id);

    if (!Number.isInteger(reportId) || reportId <= 0) {
      return res.status(400).json({
        error: "Invalid report ID."
      });
    }

    const report = findReportById.get(reportId);

    if (!report) {
      return res.status(404).json({
        error: "Report not found."
      });
    }

    if (
      report.status !== "RESOLVED" &&
      report.status !== "DISMISSED"
    ) {
      return res.status(400).json({
        error: "Only resolved or dismissed reports can be cleared"
      });
    }

    const deleted = deleteReport(reportId);

    if (!deleted) {
      return res.status(404).json({
        error: "Report not found."
      });
    }

    return res.json({
      message: "Report deleted successfully."
    });

  } catch (error) {
    next(error);
  }
}

async function updateStatus(req, res, next) {
  try {
    const reportId = Number(req.params.id);
    const { status, message } = req.body;

    if (!Number.isInteger(reportId) || reportId <= 0) {
      return res.status(400).json({
        error: "Invalid report ID."
      });
    }

    const allowedStatuses = [
      "SUBMITTED",
      "UNDER_REVIEW",
      "RESOLVED",
      "DISMISSED"
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid status."
      });
    }

    const report = findReportById.get(reportId);

    if (!report) {
      return res.status(404).json({
        error: "Report not found."
      });
    }

    updateReportStatus.run(status, reportId);

    if (message && message.trim()) {
      const { addStatusUpdate } = require("../models/reportModel");

      addStatusUpdate.run(
        reportId,
        message.trim(),
        status
      );
    }

    return res.json({
      message: "Report status updated successfully."
    });

  } catch (error) {
    next(error);
  }
}

module.exports = {
  updateStatus,
  deleteReportController
};
