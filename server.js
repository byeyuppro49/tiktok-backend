require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// fetch düzeltmesi
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();

// CORS ayarı
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:5000'] }));

// Public klasörünü aç
app.use(express.static(path.join(__dirname, 'public')));

// TikTok indirme API endpoint
app.get('/api/tiktok', async (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl) {
    return res.status(400).json({ ok: false, error: 'url parametresi zorunlu' });
  }

  const endpoint =
    'https://tiktok-download-without-watermark.p.rapidapi.com/analysis?hd=1&url=' +
    encodeURIComponent(videoUrl);

  try {
    const r = await fetch(endpoint, {
      headers: {
        'X-RapidAPI-Host': 'tiktok-download-without-watermark.p.rapidapi.com',
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        Accept: 'application/json',
      },
    });

    const data = await r.json();

    if (!data || data.code !== 0) {
      return res.status(502).json({
        ok: false,
        error: data.msg || 'Servis hatası',
        raw: data,
      });
    }

    // İndirilebilir linkler
    const noWatermark = data.data.play || null;
    const watermark = data.data.wmplay || null;
    const music = data.data.music_info?.play || null;

    res.json({
      ok: true,
      noWatermark,
      watermark,
      music,
      title: data.data.title,
      cover: data.data.cover,
    });
  } catch (e) {
    res.status(500).json({ error: 'server', detail: String(e) });
  }
});

// Doğrudan indirme endpoint
app.get('/api/download', async (req, res) => {
  const fileUrl = req.query.url;
  if (!fileUrl) {
    return res.status(400).send('url parametresi zorunlu');
  }

  try {
    const r = await fetch(fileUrl);
    if (!r.ok) {
      throw new Error(`HTTP ${r.status}`);
    }

    res.setHeader(
      'Content-Disposition',
      'attachment; filename="tiktok-video.mp4"'
    );
    r.body.pipe(res);
  } catch (e) {
    res.status(500).send('İndirme hatası: ' + e.message);
  }
});

// Sunucuyu başlat
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server çalışıyor: http://localhost:${PORT}`);
});
