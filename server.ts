import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

dotenv.config();

// Create the express app
const app = express();
const PORT = 3000;

// Enable JSON parser for body
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Google Gen AI client with developer telemetry User-Agent
let ai: GoogleGenAI | null = null;
try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  } else {
    console.warn("GEMINI_API_KEY is not defined in the environment. API endpoints will fail until configured.");
  }
} catch (error) {
  console.error("Failed to initialize GoogleGenAI client:", error);
}

// Simple health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", envApiKeyLoaded: !!process.env.GEMINI_API_KEY });
});

// Endpoint 1: Translate chunk of text
app.post("/api/translate", async (req, res) => {
  if (!ai) {
    return res.status(500).json({ error: "سرویس هوش مصنوعی راه‌اندازی نشده است. لطفاً کلید API را بررسی کنید." });
  }

  const { text, tone, glossary, context } = req.body;

  if (!text || text.trim() === "") {
    return res.status(400).json({ error: "متنی برای ترجمه ارسال نشده است." });
  }

  try {
    const toneDescriptionMap: Record<string, string> = {
      formal: "رسمی، کتابی، فاخر و جدی (مناسب کتاب‌های علمی، تاریخی و تخصصی)",
      fluent: "روان، ادبی، خوش‌خوان و امروزی ولی غیرعامیانه (مناسب رمان‌ها، کتاب‌های خودیاری و عمومی)",
      colloquial: "عامیانه، صمیمی، گفتاری و شکسته (مناسب گفتگوهای بین شخصیت‌ها در رمان)",
      academic: "علمی، آکادمیک، دقیق و وفادار تام به اصطلاحات واژه‌نامه فنی",
      literal: "وفادار، کلمه به کلمه و دقیق به ساختار جمله مبدا"
    };

    const requestedTone = toneDescriptionMap[tone] || toneDescriptionMap.fluent;

    let glossaryPrompt = "";
    if (glossary && Object.keys(glossary).length > 0) {
      glossaryPrompt = "واژه‌نامه تخصصی که حتماً باید عبارات زیر دقیقاً به معادل فارسی داده‌شده ترجمه شوند:\n" +
        Object.entries(glossary).map(([eng, fa]) => `- "${eng}" -> "${fa}"`).join("\n");
    }

    const systemInstruction = `شما یک مترجم تراز اول، حرفه‌ای و باسابقه کتاب‌های بین‌المللی به زبان فارسی هستید.
وظیفه شما ترجمه متن ورودی به فارسی روان، بدون ابهام و وفادار به مفهوم اصلی است.
نکات بحرانی که باید رعایت کنید:
۱. لحن ترجمه باید کاملاً "${requestedTone}" باشد.
۲. اصل نیم‌فاصله‌گذاری زبان فارسی (مثلاً اصلاح «کتاب ها» به «کتاب‌ها»، «می شوند» به «می‌شوند»، «پیش آمده» به «پیش‌آمده») را به شدت و دقت اعمال کنید.
۳. اصطلاحات مبدا را مستقیم ترجمه نکنید، بلکه معادل‌های ضرب‌المثلی و کنایی رایج و طبیعی فارسی را جایگزین کنید.
۴. ساختار پاراگراف‌ها و کلماتی که باید انگلیسی بمانند (مانند فرمول‌ها یا اسامی خاص بدون معادل مناسب) را حفظ کنید.
${glossaryPrompt}
${context ? `کتاب با این توصیف و موضوع کلی است: "${context}". لطفاً این زمینه را برای درک اصطلاحات حفظ کنید.` : ""}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        { role: "user", parts: [{ text: `Please translate this text into Persian as per instructions:\n\n${text}` }] }
      ],
      config: {
        systemInstruction,
        temperature: 0.3, // Lower temp for more stable/consistent translations
      }
    });

    const translatedText = response.text;
    res.json({ translatedText });
  } catch (error: any) {
    console.error("Translation API error:", error);
    res.status(500).json({ error: error.message || "خطا در برقراری ارتباط با موتور ترجمه جمینای" });
  }
});

// Endpoint 2: Persian Editorial Proofreading & Grammar Polishing (ویراستاری علمی و ادبی)
app.post("/api/edit-proofread", async (req, res) => {
  if (!ai) {
    return res.status(500).json({ error: "سرویس هوش مصنوعی راه‌اندازی نشده است" });
  }

  const { text, type } = req.body;

  if (!text || text.trim() === "") {
    return res.status(400).json({ error: "متنی برای ویراستاری ارسال نشده است." });
  }

  try {
    let modeInstruction = "";
    if (type === "halfspace") {
      modeInstruction = "تمرکز اصلی شما بر روی اصلاح نیم‌فاصله‌ها، چسباندن پیشوندها و پسوندهای دستوری (نظیر «می»، «ها»، «تر»، «ترین» و یای نسبت) و اصلاح علائم نگارشی است. لحن جمله‌ها نباید تغییر زیادی کند.";
    } else if (type === "grammar") {
      modeInstruction = "تمرکز اصلی بر روان‌سازی جمله‌ها، جابجایی فعل‌ها به جهت رعایت درست دستور زبان فارسی، حذف حشو و تکرارهای غیرضروری و بهبود جریان خوانش است.";
    } else {
      modeInstruction = "ویراستاری کامل جانانه: اصلاح تمام خطاهای دستوری، روانی جمله‌ها، بومی‌سازی اصطلاحات، نیم‌فاصله‌گذاری دقیق، همسان‌سازی علائم نگارشی نظیر ویرگول و نقطه، و رساندن متن به بهترین کیفیت ادبی ممکن جهت چاپ در کتابفروشی‌ها.";
    }

    const systemInstruction = `شما یک ویراستار ارشد و باتجربه کتب انتشارات برتر ایران هستید.
وظیفه شما بازبینی و پاک‌نویس کردن متن ترجمه فارسی ارسال شده بر طبق قواعد فرهنگستان زبان و ادب فارسی است.
دستورالعمل:
- ${modeInstruction}
- به هیچ عنوان ساختار درونی یا محتوای انتقال یافته را دگرگون یا تحریف نکنید؛ صرفاً فرم، دستور زبان، کلمات، و املای آن را ویرایش ادبی تراز اول کنید.
- فقط و فقط متن ویرایش شده نهایی را برگردانید. از نوشتن هرگونه کامنت، توضیح ثانویه، یا پیام انگلیسی و فارسی قبل یا بعد از متن ترجمه شده خودداری کنید.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        { role: "user", parts: [{ text: `لطفاً متن زیر را با توجه به دستورالعمل ارائه شده ویراستاری کرده و فقط متن نهایی اصلاح‌شده را بازگردان:\n\n${text}` }] }
      ],
      config: {
        systemInstruction,
        temperature: 0.2,
      }
    });

    res.json({ editedText: response.text });
  } catch (error: any) {
    console.error("Editorial API error:", error);
    res.status(500).json({ error: error.message || "خطا در ویراستاری ادبی متن" });
  }
});

// Endpoint 3: Analyze translated book metadata (Generate cover blurb & Table of contents)
app.post("/api/analyze-book", async (req, res) => {
  if (!ai) {
    return res.status(500).json({ error: "سرویس هوش مصنوعی راه‌اندازی نشده است" });
  }

  const { fullTextSample, originalTitle } = req.body;

  if (!fullTextSample || fullTextSample.trim() === "") {
    return res.status(400).json({ error: "متن نمونه برای تحلیل ارسال نشده است." });
  }

  try {
    const systemInstruction = `شما یک مشاور ارشد انتشارات هستید. متن ورودی بخشی از کتاب ترجمه‌شده فارسی است.
وظیفه شما این است که با تحلیل این محتوا، خروجی‌های زیر را به صورت زبان فارسی شکیل و جذاب قالب‌بندی و تولید کنید:
۱. معرفی پشت جلد (کتاب خلاصه جذاب و ترغیب‌کننده برای جذب خواننده جهت نمایش پشت جلد)
۲. مشخصات فیپا فرضی (پیشنهاد رده‌بندی دیویی، اسامی نویسندگان احتمالی، موضوعات کلیدی و شماره شابک فرضی)
۳. پیشنهاد فهرست مطالب احتمالی و چند فصل جذاب بر اساس محتوا

خروجی خود را دقیقاً با ساختار زیر تحویل دهید و هیچ توضیح اضافی ارائه نکنید. ساختار باید یک شی معتبر JSON فارسی باشد:
{
  "blurb": "متن معرفی پشت جلد بسیار جذاب به زبان فارسی",
  " DeweyDec": "رده‌بندی فرضی دیویی",
  "keywords": ["موضوع ۱", "موضوع ۲"],
  "suggestedPersianTitle": "عنوان پیشنهادی فارسی صریح و جالب",
  "toc": ["فصل اول: ...", "فصل دوم: ..."]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        { role: "user", parts: [{ text: `تحلیل کتاب با عنوان فرضی "${originalTitle || "نامشخص"}":\n\n${fullTextSample.substring(0, 8000)}` }] }
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            blurb: { type: Type.STRING, description: "A beautifully crafted book blurb in Persian for the back cover." },
            DeweyDec: { type: Type.STRING, description: "Suggested mock Dewey decimal classification" },
            keywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Subject keywords in Persian" },
            suggestedPersianTitle: { type: Type.STRING, description: "Creative and catchy Persian title suggestion" },
            toc: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Dynamic high-level proposed table of contents" }
          },
          required: ["blurb", "DeweyDec", "keywords", "suggestedPersianTitle", "toc"]
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (error: any) {
    console.error("Book analysis error:", error);
    res.status(500).json({ error: error.message || "خطا در تحلیل و استخراج اطلاعات کتاب" });
  }
});

// Endpoint 4: AI Book Cover generator using Gemini's Image Generation capabilities (Creative option!)
app.post("/api/generate-cover-image", async (req, res) => {
  if (!ai) {
    return res.status(500).json({ error: "سرویس هوش مصنوعی راه‌اندازی نشده است" });
  }

  const { title, subtitle, stylePrompt } = req.body;

  try {
    const prompt = `Premium, professional book cover graphic design for a book titled "${title || "Book"}". 
Style description: ${stylePrompt || "Minimalist, sleek, modern typography, artistic book illustration shadow, elegant texture background"}.
Do not put random messy letters, keep it extremely artistic, cinematic, high end book publisher style. High clarity.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "2:3", // Book cover aspect ratio is traditionally 2:3 or 3:4, here we request 2:3
          imageSize: "1K"
        }
      }
    });

    let coverBase64 = "";
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          coverBase64 = part.inlineData.data;
          break;
        }
      }
    }

    if (coverBase64) {
      res.json({ imageUrl: `data:image/png;base64,${coverBase64}` });
    } else {
      res.status(500).json({ error: "تصویری توسط مدل تولید نشد. مجدداً تلاش کنید." });
    }
  } catch (error: any) {
    console.error("Cover image generation error:", error);
    res.status(500).json({ error: error.message || "خطا در ساخت هوشمند عکس جلد کتاب توسط مدل تصویرساز" });
  }
});

// Endpoint 5: Extract text from uploaded PDF
app.post("/api/extract-pdf", async (req, res) => {
  const { base64Pdf } = req.body;
  if (!base64Pdf) {
    return res.status(400).json({ error: "فایل PDF به صورت Base64 ارسال نشده است." });
  }

  try {
    const pdfBuffer = Buffer.from(base64Pdf, "base64");
    const data = await pdfParse(pdfBuffer);
    
    // Clean up empty lines or double spacing if needed, but return the text
    res.json({ text: data.text });
  } catch (error: any) {
    console.error("PDF extraction error:", error);
    res.status(500).json({ error: error.message || "خطا در استخراج متن از فایل PDF." });
  }
});


// Configure Vite development server integration or serve production build assets
async function startViteMiddleware() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    // Mount Vite dev server middlewares
    app.use(vite.middlewares);
    console.log("Vite development server middleware loaded.");
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving production static elements from main dist.");
  }

  // Bind to port 3000 and the correct host required by the workspace
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || "development"} mode.`);
  });
}

startViteMiddleware().catch((err) => {
  console.error("Vite server configuration crash:", err);
});
