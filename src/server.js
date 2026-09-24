require("dotenv").config();
const express = require("express");
const db = require("./database");
const reportsRouter = require("./routes/reports");
const moderatorRouter = require("./routes/moderator");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/reports", reportsRouter);
app.use("/moderator", moderatorRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ error: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`WhistleDrop server listening on port ${PORT}`);
});