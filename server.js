// server.js
import express from "express";
import cors from "cors";
import fetch from "node-fetch";

// ---------------- BASIC SETUP ----------------
const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));

// ---------------- ENV ----------------
const PORT = process.env.PORT || 5000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// SAFETY CHECK
if (!GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is missing");
}

// ---------------- HEALTH CHECK ----------------
app.get("/", (req, res) => {
  res.send("✅ Backend is running");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ---------------- SOLVE ROUTE ----------------
app.post("/solve", async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

    // Remove base64 prefix if present
    const base64Image = image.includes(",")
      ? image.split(",")[1]
      : image;

    const MODEL = "gemini-2.5-flash";

    const url = `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const body = {
      contents: [
        {
          parts: [
            { text: "Solve the question shown in the image step by step." },
            {
              inline_data: {
                mime_type: "image/png",
                data: base64Image
              }
            }
          ]
        }
      ]
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const rawText = await response.text();
    console.log("🧠 Gemini RAW response:", rawText);

    if (!response.ok) {
      return res.status(500).json({
        error: "Gemini API error",
        details: rawText
      });
    }

    const data = JSON.parse(rawText);
    const answer =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!answer) {
      return res.status(500).json({
        error: "AI failed to answer",
        details: data
      });
    }

    res.json({ answer });

  } catch (err) {
    console.error("🔥 Server error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------- START SERVER ----------------
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
