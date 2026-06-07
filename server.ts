import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Gemini Pro Live Analysis
  app.post("/api/gemini/analyze", async (req: any, res: any) => {
    try {
      const { symbol, indicators } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "") {
        return res.json({
          analysis: `### [OFFLINE INTEGRATION MODE]\n\n**Binance Pair**: **${symbol}/USDT**\n**Indicator Verdict**: **STRONG BUY**\n\n- **RSI (14)**: \`64.8\` (Accelerating momentum without being overbought)\n- **EMA 50/200**: \`Golden Cross\` identified (EMA-50 is currently above EMA-200 with widening spread)\n- **MACD**: Histograms showing strong ascending green layout bars above the zero baseline.\n- **Support**: $${(indicators?.support || '0.00')}\n- **Resistance**: $${(indicators?.resistance || '0.00')}\n\n*Note: To fetch live real-time Gemini AI deep projections, register your \`GEMINI_API_KEY\` inside the Secrets Tab!*`
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Analyze this Cryptocurrency asset Pair symbol: ${symbol}. 
These are the technical indicators fetched from the market api:
${JSON.stringify(indicators, null, 2)}

Provide a structured financial review in markdown:
1. **Trend Overview**: Is it Bullish, Bearish, or Accumulating? Give a momentum confidence indicator.
2. **Key Levels**: Specific support & resistance levels to watch.
3. **Admin Action Projection**: How should have asset management rebalance this coin in the portfolio?
Keep is professional, precise format, and direct.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      res.json({ analysis: response.text });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // API Route for Gemini Chat Assistant
  app.post("/api/gemini/chat", async (req: any, res: any) => {
    try {
      const { messages } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "") {
        return res.json({
          reply: `Hello! I am your H.A.D. Financial AI Assistant.

I am operating in **Offline Preview Mode**. I am pre-trained with the entire H.A.D. business model details:
- **Starter Slab**: 5% Monthly ROI for ₹50,000 - ₹10 Lakhs.
- **Growth Slab**: 6% Monthly ROI for ₹11 Lakhs - ₹30 Lakhs.
- **Fortune Slab**: 7% Monthly ROI for ₹31 Lakhs - ₹50 Lakhs.
- All investments have a strict **2X Max return cap**.

To enable deep live market analysis, configure your **GEMINI_API_KEY** in the Secrets Panel.`
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      const history = messages.map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join("\n");
      const prompt = `You are the H.A.D. Asset Management AI Investment Copilot. You are speaking with the platform administrator or a verified investor.
H.A.D. Business Rules:
- STARTER (₹50,000 - ₹10,00,000) -> 5% monthly return, 2X max payoff.
- GROWTH (₹11,00,000 - ₹30,00,000) -> 6% monthly return, 2X max payoff.
- FORTUNE (₹31,00,000 - ₹50,0,000) -> 7% monthly return, 2X max payoff.
- 5% referral income.
- 10% Level partner income (given to referrers with 2+ active investor directs).
- All payouts occur on the 10th of every month.

Current conversation history:
${history}

Respond to the last query professionally, keeping answers clean and well-structured.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      res.json({ reply: response.text });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Serve static UI assets
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
