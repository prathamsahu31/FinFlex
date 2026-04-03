import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { createClient } from '@supabase/supabase-js';

// --- Monolithic additions ---
import { createServer } from 'http';
import { Server } from 'socket.io';
import YahooFinance from 'yahoo-finance2';
import { HfInference } from '@huggingface/inference';

// yahoo-finance2 v3 requires instantiation
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());
  
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // --- Supabase Setup ---
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

  // --- API Routes ---
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", type: "monolith" });
  });

  app.get('/api/chart/:symbol', async (req, res) => {
    try {
      let symbol = req.params.symbol;
      const cryptoTickers = ['BTC', 'ETH', 'SOL', 'DOGE', 'XRP', 'ADA', 'DOT'];
      if (cryptoTickers.includes(symbol.toUpperCase())) {
        symbol = `${symbol.toUpperCase()}-USD`;
      }
      const period = req.query.period as string || '1mo'; // 1d, 5d, 1mo, 3mo, 6mo, 1y, 5y, max
      
      const queryOptions: any = {
        interval: '1d',
      };

      const now = new Date();
      let period1 = new Date();

      switch (period) {
        case '1d':
          period1.setDate(now.getDate() - 1);
          queryOptions.interval = '5m';
          break;
        case '5d':
          period1.setDate(now.getDate() - 5);
          queryOptions.interval = '15m';
          break;
        case '1mo':
          period1.setMonth(now.getMonth() - 1);
          break;
        case '3mo':
          period1.setMonth(now.getMonth() - 3);
          break;
        case '6mo':
          period1.setMonth(now.getMonth() - 6);
          break;
        case '1y':
          period1.setFullYear(now.getFullYear() - 1);
          break;
        case '5y':
          period1.setFullYear(now.getFullYear() - 5);
          queryOptions.interval = '1wk';
          break;
        default:
          period1.setMonth(now.getMonth() - 1);
      }

      queryOptions.period1 = period1;
      queryOptions.period2 = now;

      const result = await yahooFinance.chart(symbol, queryOptions);
      res.json(result);
    } catch (error: any) {
      console.error(`Chart error for ${req.params.symbol}:`, error);
      res.status(500).json({ error: 'Failed to fetch chart data' });
    }
  });

  app.get('/api/stock/quote/:symbol', async (req, res) => {
    try {
      const { symbol } = req.params;
      const quote = await yahooFinance.quote(symbol);
      res.json(quote);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/stock/search', async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') return res.json([]);
      
      const results: any = await yahooFinance.search(q);
      const mapped = results.quotes
        .filter((quote: any) => ['EQUITY', 'CRYPTOCURRENCY', 'ETF'].includes(quote.quoteType))
        .slice(0, 5)
        .map((quote: any) => ({
          symbol: quote.symbol,
          name: quote.shortname || quote.longname || quote.symbol
        }));
        
      res.json(mapped);
    } catch (error: any) {
      console.error('YF search error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Trade execution is handled directly via Supabase client in the frontend
  // to leverage implicit RLS auth. No server endpoint needed.

  // --- Hugging Face Native Integration ---
  const hf = new HfInference(process.env.HF_API_KEY || process.env.VITE_HF_API_KEY);
  
  app.get('/api/ml/predict/:symbol', async (req, res) => {
    try {
      const { symbol } = req.params;
      
      const prompt = `Analyze the stock or crypto ticker "${symbol}". Predict if its very short-term trend is Bullish or Bearish and give a confidence score from 50 to 99. Output ONLY a valid JSON object in this exact format: {"predicted_trend": "Bullish", "confidence_score": 85}. Do not include markdown formatting or reasoning.`;
      
      // Fallback
      let prediction: any = { predicted_trend: "Bullish", confidence_score: 82.5, is_fallback: true };
      
      if (hf) {
        try {
          const result = await hf.textGeneration({
            model: 'mistralai/Mistral-7B-Instruct-v0.3',
            inputs: prompt,
            parameters: { max_new_tokens: 50, return_full_text: false, temperature: 0.1 }
          });
          
          const output = result.generated_text.trim();
          const jsonMatch = output.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            prediction.predicted_trend = parsed.predicted_trend || prediction.predicted_trend;
            prediction.confidence_score = parsed.confidence_score || prediction.confidence_score;
            prediction.is_fallback = false;
          }
        } catch (e: any) {
          console.error("HF Inference Error (Predict):", e.message);
        }
      }
      
      res.json(prediction);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/ml/recommendations/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      
      let transactionHistory = "No recent transactions.";
      if (supabase) {
         // Gather user's transactions to personalize
         const { data: tx } = await supabase.from('transactions').select('vendor, amount, category').eq('user_id', userId).limit(10);
         if (tx && tx.length > 0) {
           transactionHistory = tx.map((t: any) => `${t.category}: spent/earned ${Math.abs(t.amount)} at ${t.vendor}`).join(', ');
         }
      }

      const prompt = `Based on a user whose recent financial transactions are: [${transactionHistory}], recommend 3 stock tickers for them to invest in. Provide a concise reason for each why it matches their spending habits. Output ONLY valid JSON in this exact format: {"recommendations": [{"symbol": "AAPL", "confidence": 90, "reason": "Because they spend heavily on electronics."}]}. Do not include markdown formatting.`;
      
      let defaultRecs = {
        recommendations: [
          { symbol: "AAPL", confidence: 88, reason: "Consistent performer for a balanced portfolio based on your steady income." },
          { symbol: "MSFT", confidence: 85, reason: "Strong AI sector growth matching modern tech trends." },
          { symbol: "V", confidence: 78, reason: "Aligns with high consumer spending velocity." }
        ]
      };
      
      if (hf) {
        try {
          const result = await hf.textGeneration({
            model: 'mistralai/Mistral-7B-Instruct-v0.3',
            inputs: prompt,
            parameters: { max_new_tokens: 300, return_full_text: false, temperature: 0.3 }
          });
          const output = result.generated_text.trim();
          const jsonMatch = output.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            defaultRecs = JSON.parse(jsonMatch[0]);
          }
        } catch (e: any) {
          console.error("HF Inference Error (Recommendations):", e.message);
        }
      }
      
      res.json(defaultRecs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/ml/risk-profile/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      
      let profileData = "";
      if (supabase) {
         const { data: prof } = await supabase.from('profiles').select('*').eq('id', userId).single();
         if (prof) {
            profileData = `Age: ${prof.age}, Savings: ${prof.current_savings}, Risk Tolerance specified: ${prof.risk_tolerance}`;
         }
      }

      const prompt = `Profile a user's financial risk based on: [${profileData}]. Output strictly a valid JSON object in this format: {"category": "Aggressive Growth", "risk_score": 85}. Do not include markdown formatting. Keep the category short (max 3 words).`;
      
      let profile = { category: "Balanced Investor", risk_score: 65 };
      
      if (hf) {
        try {
          const result = await hf.textGeneration({
            model: 'mistralai/Mistral-7B-Instruct-v0.3',
            inputs: prompt,
            parameters: { max_new_tokens: 50, return_full_text: false, temperature: 0.1 }
          });
          const output = result.generated_text.trim();
          const jsonMatch = output.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
             profile = JSON.parse(jsonMatch[0]);
          }
        } catch (e: any) {
          console.error("HF Inference Error (Risk):", e.message);
        }
      }
      res.json(profile);
    } catch(err: any) {
       res.status(500).json({ error: err.message });
    }
  });

  // --- WebSockets: Real-time Market Data ---
  let activeWatchlist = new Set(['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'SPY']);

  const fetchLivePrices = async () => {
    if (io.engine.clientsCount === 0) return; 

    try {
      const symbols = Array.from(activeWatchlist);
      if (symbols.length === 0) return;
      
      // yahoo-finance2 .quote() may return a single object or array
      const rawQuotes: any = await yahooFinance.quote(symbols);
      const quotesArray = Array.isArray(rawQuotes) ? rawQuotes : [rawQuotes];
      
      const formattedData = quotesArray
        .filter((q: any) => q && q.symbol && q.regularMarketPrice)
        .map((q: any) => ({
          symbol: q.symbol,
          price: q.regularMarketPrice,
          change: q.regularMarketChangePercent,
          volume: q.regularMarketVolume,
          timestamp: Date.now()
        }));

      if (formattedData.length > 0) {
        io.emit('marketUpdate', formattedData);
      }
    } catch (error) {
      console.error('Error fetching live prices:', error);
    }
  };

  // Poll every 7 seconds
  setInterval(fetchLivePrices, 7000);

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    
    socket.on('subscribe', (symbol: string) => {
      activeWatchlist.add(symbol.toUpperCase());
      console.log(`Added ${symbol} to active watchlist`);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  // Vite middleware for development
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

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Monolithic Server running on http://localhost:${PORT}`);
  });
}

startServer();
