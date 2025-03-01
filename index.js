import axios from "axios";
import morgan from "morgan";
import express from "express";
import { fileURLToPath } from "url";
import { dirname } from "path";
import Anthropic from "@anthropic-ai/sdk";
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY is not set in environment variables");
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());
app.use(morgan("tiny"));

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY is not set in environment variables");
  process.exit(1);
}

const anthropic = new Anthropic({
  apiKey: process.env["ANTHROPIC_API_KEY"]
});

// Add basic error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.post("/story", async (req, res) => {
  try {
    console.log("Received request for animal:", req.body); // Debug log
    const animal = req.body['animal'];
    const moral = req.body['moral'];
    if (!animal) {
      return res.status(400).json({ error: "Animal parameter is required" });
    }

    let moral_prompt = "";

    if (moral && moral !== "") {
      moral_prompt = `Please make sure the story has the following moral: ${moral}`;
    }
    const msg = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [{ role: "user", content: `Tell me a rhyming bedtime story about a ${animal} comprehensible by a 4 year old. 
        Please do not include emojis in the text.
        ${moral_prompt}
        ` }],
    });
    
    console.log("Anthropic response:", msg); // Debug log
    res.json({ story: msg.content[0].text });
  } catch (error) {
    console.error("Detailed error:", error); // Debug log
    res.status(500).json({ 
      error: error.message,
      details: error.stack 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
