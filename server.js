require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

// dynamic import for node-fetch
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();

app.use(cors({ origin: ["http://localhost:3000", "http://localhost:5000"] }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const API_BASE = process.env.API_BASE || "https://tiktok-download-without-watermark.p.rapidapi.com";
const API_PATH = process.env.API_PATH || "/analysis";
const API_HOST = process.env.API_HOST || "tiktok-download-without-watermark.p.rapidapi.com";
const API_KEY  = process.env.API_KEY || "6fc9980876msha28e124b037763fp1f662bjsnbeb1af0608f4";

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/tiktok", async (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl) {
    return res.status(400).json({ ok: false, error: "url parametresi zorunlu" });
  }

  const endpoint = `${API_BASE}${API_PATH}?hd=1&url=${encodeURIComponent(videoUrl)}`;

  try {
    const r = await fetch(endpoint, {
      headers: {
        "X-RapidAPI-Host": API_HOST,
        "X-RapidAPI-Key": API_KEY,
        Accept: "application/json"
      }
    });

    const data = await r.json();

    if (!data || data.code !== 0) {
      return res.status(502).json({
        ok: false,
        error: (data && (data.msg || data.message)) || "Servis hatası",
        raw: data
      });
    }

    const noWatermark = data.data?.play || null;
    const watermark = data.data?.wmplay || null;
    const music = data.data?.music_info?.play || null;

    res.json({
      ok: true,
      noWatermark,
      watermark,
      music,
      title: data.data?.title,
      cover: data.data?.cover
    });
  } catch (e) {
    res.status(500).json({ error: "server", detail: String(e) });
  }
});

app.get("/api/download", async (req, res) => {
  const fileUrl = req.query.url;
  if (!fileUrl) {
    return res.status(400).send("url parametresi zorunlu");
  }

  try {
    const r = await fetch(fileUrl);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);

    res.setHeader("Content-Disposition", 'attachment; filename="tiktok-video.mp4"');
    r.body.pipe(res);
  } catch (e) {
    res.status(500).send("İndirme hatası: " + e.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server çalışıyor: http://localhost:${PORT}`);
});
