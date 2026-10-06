import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import Razorpay from "razorpay";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
app.use(express.json());

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, "public")));

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const razorpay =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
      })
    : null;

app.post("/api/generate", async (req, res) => {
  try {
    const { name, relation, tone, language, detail = "" } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required." });
    }

    if (!openai) {
      return res.status(503).json({
        error: "AI is not configured yet. Add OPENAI_API_KEY on the server."
      });
    }

    const prompt = `Write one original birthday wish.

Name: ${name}
Relationship: ${relation}
Tone: ${tone}
Language: ${language}
Personal detail: ${detail || "none"}

Keep it warm and natural, 80-130 words, no hashtags, no quotation marks.`;

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5-mini",
      input: prompt
    });

    res.json({ text: response.output_text });
  } catch (e) {
    console.error(
      "OpenAI generation error:",
      e?.status,
      e?.code,
      e?.message
    );

    res.status(500).json({
      error: "AI generation failed. Please try again."
    });
  }
});

app.post("/api/create-order", async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(503).json({
        error: "Razorpay is not configured yet."
      });
    }

    const order = await razorpay.orders.create({
      amount: 9900,
      currency: "INR",
      receipt: "wishcraft_" + Date.now()
    });

    res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (e) {
    console.error(
      "Razorpay order error:",
      e?.status,
      e?.code,
      e?.message
    );

    res.status(500).json({
      error: "Could not create payment order."
    });
  }
});

app.post("/api/verify-payment", async (req, res) => {
  try {
    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(503).json({
        error: "Razorpay is not configured yet."
      });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        error: "Missing payment verification details."
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(
        razorpay_order_id + "|" + razorpay_payment_id
      )
      .digest("hex");

    const valid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(razorpay_signature)
    );

    if (!valid) {
      return res.status(400).json({
        error: "Payment verification failed."
      });
    }

    res.json({ success: true });
  } catch (e) {
    console.error(
      "Razorpay verification error:",
      e?.message
    );

    res.status(500).json({
      error: "Payment verification failed."
    });
  }
});

app.get("/{*splat}", (req, res) => {
  res.sendFile(
    path.join(__dirname, "public", "index.html")
  );
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`WishCraft running on port ${port}`);
});
