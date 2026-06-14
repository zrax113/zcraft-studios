export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false });
  }

  const body = typeof req.body === 'object' && req.body ? req.body : {};
  const entry = {
    event: String(body.event || 'client_log').slice(0, 80),
    page: String(body.page || '').slice(0, 120),
    path: String(body.path || '').slice(0, 240),
    message: String(body.message || '').slice(0, 800),
    userAgent: String(req.headers['user-agent'] || '').slice(0, 240),
    ts: new Date().toISOString()
  };

  console.log('zcraft-client-log', JSON.stringify(entry));
  return res.status(200).json({ ok: true });
}
