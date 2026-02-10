require("dotenv").config()
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv")
const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = process.env.PORT || 5000;

// Replace with your actual Chitkara email
const OFFICIAL_EMAIL = "sarthak1369.be23@chitkara.edu.in";

// Replace with your Gemini API key in environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is not set in environment variables.");
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());

// Helper functions (RENAMED ONLY)
function buildFibonacciSeries(n) {
  if (n <= 0) return [];
  let fib = [0, 1];
  for (let i = 2; i < n; i++) {
    fib.push(fib[i - 1] + fib[i - 2]);
  }
  return fib.slice(0, n);
}

function checkPrimeNumber(num) {
  if (num <= 1) return false;
  if (num <= 3) return true;
  if (num % 2 === 0 || num % 3 === 0) return false;
  for (let i = 5; i * i <= num; i += 6) {
    if (num % i === 0 || num % (i + 2) === 0) return false;
  }
  return true;
}

function calculateGCD(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    let temp = b;
    b = a % b;
    a = temp;
  }
  return a;
}

function calculateLCM(a, b) {
  return Math.abs(a * b) / calculateGCD(a, b);
}

function findArrayGCD(numbers) {
  if (numbers.length === 0) return 0;
  let result = numbers[0];
  for (let i = 1; i < numbers.length; i++) {
    result = calculateGCD(result, numbers[i]);
    if (result === 1) return 1;
  }
  return result;
}

function findArrayLCM(numbers) {
  if (numbers.length === 0) return 0;
  let result = numbers[0];
  for (let i = 1; i < numbers.length; i++) {
    result = calculateLCM(result, numbers[i]);
  }
  return result;
}

async function fetchAIAnswer(question) {
  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Answer the following question with exactly one word, no additional text or explanations: ${question}`,
    });
    console.log(response.text);
    return response.text;
  } catch (error) {
    console.error("AI API error:", error);
    throw new Error("Failed to get AI response");
  }
}

// GET /health
app.get("/health", (req, res) => {
  res.status(200).json({
    is_success: true,
    official_email: OFFICIAL_EMAIL,
  });
});

// POST /bfhl
app.post("/bfhl", async (req, res) => {
  const body = req.body;
  const keys = Object.keys(body);

  if (keys.length !== 1) {
    return res.status(400).json({
      is_success: false,
      official_email: OFFICIAL_EMAIL,
      message: "Request must contain exactly one key",
    });
  }

  const key = keys[0];
  const value = body[key];

  try {
    let data;
    switch (key) {
      case "fibonacci":
        if (!Number.isInteger(value) || value <= 0) {
          throw new Error("Input must be a positive integer");
        }
        data = buildFibonacciSeries(value);
        break;

      case "prime":
        if (!Array.isArray(value) || !value.every(Number.isInteger)) {
          throw new Error("Input must be an array of integers");
        }
        data = value.filter(checkPrimeNumber);
        break;

      case "lcm":
        if (!Array.isArray(value) || value.length < 2 || !value.every(Number.isInteger)) {
          throw new Error("Input must be an array of at least two integers");
        }
        if (value.some((num) => num === 0)) {
          throw new Error("Numbers cannot include zero for LCM");
        }
        data = findArrayLCM(value);
        break;

      case "hcf":
        if (!Array.isArray(value) || value.length < 2 || !value.every(Number.isInteger)) {
          throw new Error("Input must be an array of at least two integers");
        }
        data = findArrayGCD(value);
        break;

      case "AI":
        if (typeof value !== "string" || value.trim() === "") {
          throw new Error("Input must be a non-empty string question");
        }
        data = await fetchAIAnswer(value);
        break;

      default:
        throw new Error("Invalid key. Supported keys: fibonacci, prime, lcm, hcf, AI");
    }

    res.status(200).json({
      is_success: true,
      official_email: OFFICIAL_EMAIL,
      data,
    });
  } catch (error) {
    res.status(400).json({
      is_success: false,
      official_email: OFFICIAL_EMAIL,
      message: error.message,
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
