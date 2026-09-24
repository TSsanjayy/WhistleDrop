const express = require("express");

const {
  createReport,
  getReportByCaseCode
} = require("../controllers/reportController");

const router = express.Router();

router.post("/", createReport);

router.get("/:caseCode", getReportByCaseCode);

module.exports = router;    