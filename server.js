require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Health check
app.get("/", (req, res) => {
  res.send("✅ Gemini 2.5 Flash backend running");
});

// Receive screenshot and send to Gemini
app.post("/solve", async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ success: false, message: "No image received" });
    }

    console.log("📸 Screenshot received in backend");

    // IMPORTANT: USE ONLY GEMINI 2.5 FLASH
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

    // Convert Base64 to Gemini format
    const imagePart = {
      inlineData: {
        data: image.split(",")[1], // remove base64 prefix
        mimeType: "image/png"
      }
    };

    const prompt = `
You are a helpful school tutor.
Read the question in the image and solve it step-by-step.
Explain clearly and simply.
`;

    const result = await model.generateContent([
      prompt,
      imagePart
    ]);

    const response = result.response.text();

    console.log("✅ Gemini responded");

    res.json({
      success: true,
      answer: response
    });

  } catch (err) {
    console.error("❌ Gemini error:", err.message);

    res.status(500).json({
      success: false,
      message: "Gemini processing failed"
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🔥 Backend running on http://localhost:${PORT}`);
  console.log("🧠 Model in use: gemini-2.5-flash");
});

