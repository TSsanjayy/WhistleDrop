require("dotenv").config();

const express = require("express");
const path = require("path");

require("./src/database");

const reportsRouter = require("./src/routes/reports");
const moderatorRouter = require("./src/routes/moderator");
const { notFound, errorHandler } = require("./src/middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/reports", reportsRouter);
app.use("/moderator", moderatorRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`WhistleDrop server listening on port ${PORT}`);
});