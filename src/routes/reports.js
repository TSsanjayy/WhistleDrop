const express = require("express");

const {
  createReport,
  getReportByCaseCode,
  uploadEvidence,
  addReportReply
} = require("../controllers/reportController");
const { upload } = require("../middleware/upload");

const router = express.Router();

router.post("/", upload.single("attachment"), createReport);

router.get("/:caseCode", getReportByCaseCode);

router.post("/:caseCode/reply", addReportReply);

router.post(
  "/:caseCode/evidence",
  upload.single("evidence"),
  uploadEvidence
);

module.exports = router;    