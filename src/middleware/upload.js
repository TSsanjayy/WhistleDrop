const crypto = require("crypto");
const fs = require("fs");
const multer = require("multer");
const path = require("path");

const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").slice(0, 10);
    cb(null, `${Date.now()}-${crypto.randomBytes(16).toString("hex")}${ext}`);
  },
});

const BLOCKED = new Set([
  "application/x-msdownload",
  "application/x-msdos-program",
  "application/x-executable",
  "application/x-sh",
]);

function fileFilter(req, file, cb) {
  if (BLOCKED.has(file.mimetype) || /\.exe$/i.test(file.originalname || "")) {
    const err = new Error("File type not allowed.");
    err.status = 400;
    return cb(err);
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
});

module.exports = { upload, UPLOAD_DIR };
