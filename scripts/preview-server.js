const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.argv[2] || process.env.PORT || 8000;
const root = process.cwd();

function loadVercelRewrites() {
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
    return cfg.rewrites || [];
  } catch (e) {
    return [];
  }
}

function toRegex(src) {
  // Convert patterns like /blogs/:slug to a regex and list of param names
  const names = [];
  const regexText = src.replace(/([.+^=!:${}()|[\]\\])/g, '\\$1')
    .replace(/\\:([a-zA-Z0-9_]+)/g, (_, name) => { names.push(name); return '([^/]+)'; });
  return { re: new RegExp(`^${regexText}$`), names };
}

function applyRewrites(urlPath, rewrites) {
  for (const r of rewrites) {
    const { re, names } = toRegex(r.source);
    const m = urlPath.match(re);
    if (m) {
      let dest = r.destination;
      names.forEach((n, i) => {
        dest = dest.replace(`:${n}`, m[i+1]);
      });
      return dest;
    }
  }
  return urlPath;
}

function send404(res) {
  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end('404 Not Found');
}

const rewrites = loadVercelRewrites();

const server = http.createServer((req, res) => {
  try {
    const url = decodeURIComponent(req.url.split('?')[0]);
    let target = applyRewrites(url, rewrites);

    // If target is a directory-like path, try index.html
    if (target.endsWith('/')) target += 'index.html';

    // If the target doesn't have an extension, try as-is and then with .html
    const fullPaths = [];
    fullPaths.push(path.join(root, `.${target}`));
    if (!path.extname(target)) fullPaths.push(path.join(root, `.${target}.html`));

    // Also allow flat filenames like /blogs/slug -> /blog-slug.html (common generator output)
    // This is handled by rewrites in vercel.json already.

    let served = false;
    for (const p of fullPaths) {
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        const stream = fs.createReadStream(p);
        const ext = path.extname(p).toLowerCase();
        const mime = ext === '.html' ? 'text/html; charset=utf-8' : (ext === '.json' ? 'application/json' : 'application/octet-stream');
        res.statusCode = 200;
        res.setHeader('Content-Type', mime);
        stream.pipe(res);
        served = true;
        break;
      }
    }
    if (!served) send404(res);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('500 ' + String(err.message));
  }
});

server.listen(PORT, () => console.log(`Preview server running on http://0.0.0.0:${PORT}/`));
