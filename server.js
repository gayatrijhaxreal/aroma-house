const express = require('express');
const cors = require('cors');
const fs = require('fs/promises');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const DATA_DIR = path.join(__dirname, 'data');
const SITE_DATA_PATH = path.join(DATA_DIR, 'site-content.json');
const INQUIRIES_PATH = path.join(DATA_DIR, 'inquiries.json');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'aroma-house-api' });
});

app.get('/api/site-content', async (_req, res) => {
  try {
    const raw = await fs.readFile(SITE_DATA_PATH, 'utf8');
    res.json(JSON.parse(raw));
  } catch (error) {
    res.status(500).json({ error: 'Could not load site content' });
  }
});

function isAdminRequest(req) {
  if (!ADMIN_TOKEN) {
    return true;
  }

  const headerToken = req.get('x-admin-token');
  const bearerToken = req.get('authorization')?.startsWith('Bearer ')
    ? req.get('authorization').slice(7)
    : '';
  const queryToken = typeof req.query.token === 'string' ? req.query.token : '';

  return [headerToken, bearerToken, queryToken].some((token) => token === ADMIN_TOKEN);
}

function requireAdminToken(req, res, next) {
  if (isAdminRequest(req)) {
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized' });
}

app.post('/api/inquiries', async (req, res) => {
  const { name, phone, message } = req.body || {};

  if (!name || !phone || !message) {
    return res.status(400).json({ error: 'name, phone and message are required' });
  }

  const inquiry = {
    id: Date.now(),
    name: String(name).trim(),
    phone: String(phone).trim(),
    message: String(message).trim(),
    createdAt: new Date().toISOString()
  };

  try {
    await fs.mkdir(DATA_DIR, { recursive: true });

    let existing = [];
    try {
      const raw = await fs.readFile(INQUIRIES_PATH, 'utf8');
      existing = JSON.parse(raw);
      if (!Array.isArray(existing)) {
        existing = [];
      }
    } catch (_error) {
      existing = [];
    }

    existing.unshift(inquiry);
    await fs.writeFile(INQUIRIES_PATH, JSON.stringify(existing, null, 2), 'utf8');

    return res.status(201).json({
      ok: true,
      message: 'Inquiry submitted successfully',
      inquiryId: inquiry.id
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to save inquiry' });
  }
});

app.get('/api/admin/inquiries', requireAdminToken, async (_req, res) => {
  try {
    const raw = await fs.readFile(INQUIRIES_PATH, 'utf8');
    const inquiries = JSON.parse(raw);

    return res.json({
      ok: true,
      total: Array.isArray(inquiries) ? inquiries.length : 0,
      inquiries: Array.isArray(inquiries) ? inquiries : []
    });
  } catch (error) {
    return res.json({ ok: true, total: 0, inquiries: [] });
  }
});

app.get(['/admin', '/admin.html'], (_req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Aroma House server running on port ${PORT}`);
});
