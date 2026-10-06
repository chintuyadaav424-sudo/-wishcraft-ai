import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import Razorpay from "razorpay";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
app.use(express.json());
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, "public")));

const openai = process.env.OPENAI_API_KEY ? new OpenAI({apiKey: process.env.OPENAI_API_KEY}) : null;
const razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({key_id:process.env.RAZORPAY_KEY_ID,key_secret:process.env.RAZORPAY_KEY_SECRET}) : null;

app.post("/api/generate", async (req,res)=>{
  try{
    const {name,relation,tone,language,detail=""}=req.body;
    if(!name) return res.status(400).json({error:"Name is required."});
    if(!openai) return res.status(503).json({error:"AI is not configured yet. Add OPENAI_API_KEY on the server."});
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
    res.json({text:response.output_text});
  }catch(e){res.status(500).json({error:"AI generation failed."});}
});

app.post("/api/create-order", async (req,res)=>{
  try{
    if(!razorpay) return res.status(503).json({error:"Razorpay is not configured yet."});
    const order = await razorpay.orders.create({amount:9900,currency:"INR",receipt:"wishcraft_"+Date.now(),payment_capture:1});
    res.json({order_id:order.id,amount:order.amount,currency:order.currency,key:process.env.RAZORPAY_KEY_ID});
  }catch(e){res.status(500).json({error:"Could not create payment order."});}
});

app.get("/{*splat}",,(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));

const port=process.env.PORT || 3000;
app.listen(port,()=>console.log(`WishCraft running on port ${port}`));
