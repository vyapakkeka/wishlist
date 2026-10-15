const { put, list } = require('@vercel/blob');
const KEY = 'reservations.json';

async function read() {
  const { blobs } = await list({ prefix: KEY, limit: 1 });
  if (!blobs.length) return {};
  const r = await fetch(blobs[0].url + '?t=' + Date.now(), { cache: 'no-store' });
  return r.ok ? await r.json() : {};
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method === 'GET') return res.status(200).json(await read());
    if (req.method === 'POST') {
      const { id, reserved } = req.body || {};
      if (typeof id !== 'string' || !/^[a-z0-9-]{1,40}$/.test(id)) return res.status(400).json({ error: 'bad id' });
      const cur = await read();
      if (reserved) cur[id] = true; else delete cur[id];
      await put(KEY, JSON.stringify(cur), { access: 'public', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json', cacheControlMaxAge: 60 });
      return res.status(200).json(cur);
    }
    res.status(405).end();
  } catch (e) {
    res.status(500).json({ error: 'failed' });
  }
};
