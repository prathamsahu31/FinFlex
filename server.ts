import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import TelegramBot from "node-telegram-bot-api";
import { createClient } from '@supabase/supabase-js';

// --- Monolithic additions ---
import { createServer } from 'http';
import { Server } from 'socket.io';
import yahooFinance from 'yahoo-finance2';

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

  // --- Telegram Bot Setup (Clawbot) ---
  const token = process.env.TELEGRAM_BOT_TOKEN;
  let bot: TelegramBot | null = null;
  
  if (token && supabase) {
    try {
      bot = new TelegramBot(token, { polling: true });
      
      bot.on('polling_error', (error) => {
        console.error("Telegram Bot Polling Error:", error.message);
      });
      
      bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      bot?.sendMessage(chatId, "Welcome to FinFlex Clawbot! Send me your expenses like: '50 for groceries' and my AI will log them. Make sure your Telegram ID is linked in your FinFlex account.");
    });

    bot.on('message', async (msg) => {
      if (msg.text && !msg.text.startsWith('/')) {
        const chatId = msg.chat.id;
        
        // Basic parsing: "50 for groceries"
        const match = msg.text.match(/(\d+(?:\.\d+)?)\s+(?:for|on)\s+(.+)/i);
        if (match) {
          const amount = parseFloat(match[1]);
          const description = match[2];
          
          try {
            // Find user by telegram_chat_id
            const { data: users, error: userError } = await supabase
              .from('users')
              .select('id')
              .eq('telegram_chat_id', chatId.toString())
              .single();

            if (userError || !users) {
              bot?.sendMessage(chatId, `I couldn't find a FinFlex account linked to this Telegram chat. Your Chat ID is: ${chatId}. Please link it in your settings.`);
              return;
            }

            // Save to Supabase
            const { error: insertError } = await supabase
              .from('transactions')
              .insert([
                {
                  user_id: users.id,
                  vendor: description,
                  amount: -amount, // Expenses are negative
                  date: new Date().toISOString().split('T')[0],
                  category: 'Other',
                  is_gig: false
                }
              ]);

            if (insertError) throw insertError;

            bot?.sendMessage(chatId, `✅ Logged $${amount} for ${description}.`);
          } catch (error: any) {
            console.error("Telegram Bot Error:", error);
            bot?.sendMessage(chatId, "Sorry, there was an error saving your transaction.");
          }
        } else {
          bot?.sendMessage(chatId, "I didn't understand that. Try sending: '50 for groceries'");
        }
      }
    });
    } catch (e) {
      console.error("Failed to initialize Telegram Bot:", e);
    }
  } else {
    console.warn("TELEGRAM_BOT_TOKEN or Supabase credentials not found. Clawbot is disabled.");
  }

  // --- API Routes ---
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", type: "monolith" });
  });

  app.get('/api/stock/history/:symbol', async (req, res) => {
    try {
      const { symbol } = req.params;
      const { range = '1mo' } = req.query;
      
      const period1 = new Date();
      if (range === '1mo') period1.setMonth(period1.getMonth() - 1);
      else if (range === '3mo') period1.setMonth(period1.getMonth() - 3);
      else if (range === '1y') period1.setFullYear(period1.getFullYear() - 1);
      else period1.setMonth(period1.getMonth() - 1);

      const queryOptions: any = { period1: period1.toISOString() };
      const result = await yahooFinance.historical(symbol, queryOptions);
      res.json(result);
    } catch (error: any) {
      console.error('YF history error:', error);
      res.status(500).json({ error: error.message });
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

  app.post('/api/trade/execute', async (req, res) => {
    res.json({ status: 'Endpoint deprecated: Use Supabase client directly in frontend for trades to leverage implicit RLS auth.' });
  });

  // --- ML Proxy (Connects the Hybrid Monolith) ---
  const ML_SERVICE_URL = process.env.VITE_ML_API_URL || 'http://localhost:8000';
  
  app.all('/api/ml/*', async (req, res) => {
    try {
      const targetUrl = `${ML_SERVICE_URL}${req.originalUrl}`;
      const response = await fetch(targetUrl, {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
          // Pass along any other relevant headers if needed
        },
        body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? JSON.stringify(req.body) : undefined,
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error: any) {
      console.error('ML Proxy Error:', error.message);
      res.status(502).json({ error: 'ML Service is currently unreachable. Make sure it is running on port 8000.' });
    }
  });

  // --- WebSockets: Real-time Market Data ---
  let activeWatchlist = new Set(['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'SPY']);

  const fetchLivePrices = async () => {
    if (io.engine.clientsCount === 0) return; 

    try {
      const symbols = Array.from(activeWatchlist);
      const quotes: any = await yahooFinance.quote(symbols);
      
      const formattedData = quotes.map((q: any) => ({
        symbol: q.symbol,
        price: q.regularMarketPrice,
        change: q.regularMarketChangePercent,
        volume: q.regularMarketVolume,
        timestamp: Date.now()
      }));

      io.emit('marketUpdate', formattedData);
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
