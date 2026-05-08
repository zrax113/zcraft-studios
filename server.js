const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;

// Serve static files from the current directory and support clean URL lookups for HTML files
app.use(express.static('.', { extensions: ['html'] }));

// Rewrites for clean URLs
app.get(['/team', '/team/', '/teams', '/teams/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'team.html'));
});
app.get(['/about', '/about/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'about.html'));
});
app.get(['/contact', '/contact/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'contact.html'));
});
app.get(['/resources', '/resources/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'resources.html'));
});

// Fallback clean routes for any other page if a matching HTML file exists
app.get('/:page', (req, res, next) => {
  const pageName = req.params.page;
  const htmlFile = path.join(__dirname, `${pageName}.html`);
  fs.access(htmlFile, fs.constants.R_OK, (err) => {
    if (err) return next();
    res.sendFile(htmlFile);
  });
});

// For root, serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Catch all for 404
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '404.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});