function notFound(req, res) {
  res.status(404).json({ error: "Not found" });
}

function errorHandler(err, req, res, next) {
  console.error(`[${req.method} ${req.originalUrl}]`, err);

  if (err && err.name === "MulterError") {
    return res.status(400).json({ error: err.message || "File upload failed." });
  }

  const status = err.status || err.statusCode || 500;

  // Never leak internal error details (stack traces, DB errors, etc.)
  // to the client on unexpected failures — only pass through messages
  // from errors explicitly marked as safe/operational.
  const message =
    status < 500 || err.expose
      ? err.message || "Something went wrong."
      : "Internal server error";

  res.status(status).json({ error: message });
}

module.exports = {
  notFound,
  errorHandler
};