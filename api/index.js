const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();

// allow static file serving
app.use(express.static(path.join(__dirname, ".."), {
  extensions: ["html"]
}));

// routes (same logic as yours)
app.get(["/team", "/team/", "/teams", "/teams/"], (req, res) => {
  res.sendFile(path.join(__dirname, "..", "team.html"));
});

app.get(["/about", "/about/"], (req, res) => {
  res.sendFile(path.join(__dirname, "..", "about.html"));
});

app.get(["/contact", "/contact/"], (req, res) => {
  res.sendFile(path.join(__dirname, "..", "contact.html"));
});

app.get(["/resources", "/resources/"], (req, res) => {
  res.sendFile(path.join(__dirname, "..", "resources.html"));
});

// dynamic page handler
app.get("/:page", (req, res, next) => {
  const file = path.join(__dirname, "..", `${req.params.page}.html`);

  fs.access(file, fs.constants.R_OK, (err) => {
    if (err) return next();
    res.sendFile(file);
  });
});

// home
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

// 404 fallback
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "..", "404.html"));
});

// IMPORTANT: no app.listen()
module.exports = app;
