require("dotenv").config();

function moderatorAuth(req, res, next) {
  const key = req.headers["x-moderator-key"];

  if (!key) {
    return res.status(401).json({
      error: "Moderator key required"
    });
  }

  if (key !== process.env.MODERATOR_KEY) {
    return res.status(403).json({
      error: "Invalid moderator key"
    });
  }

  next();
}

module.exports = moderatorAuth;