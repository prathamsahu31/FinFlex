import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import yahooFinance from 'yahoo-finance2';

dotenv.config({ path: '../.env' }); // Adjust if .env is in root

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;

// --- WebSockets: Real-time Market Data ---
// We simulate real-time data by polling Yahoo Finance every 5 seconds for watched tickers
let activeWatchlist = new Set(['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'SPY']);

const fetchLivePrices = async () => {
  if (io.engine.clientsCount === 0) return; // Don't fetch if no clients connected

  try {
    const symbols = Array.from(activeWatchlist);
    const quotes = await yahooFinance.quote(symbols);
    
    const formattedData = quotes.map(q => ({
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

// Poll every 5 seconds (Be careful of YF rate limits in prod, use WebSockets from Alpaca/Polygon if possible)
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

// --- API Routes ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running correctly', timestamp: new Date() });
});

// Basic endpoint to proxy Yahoo Finance historical data for candlesticks
app.get('/api/stock/history/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { range = '1mo' } = req.query; // '1d', '5d', '1mo', '3mo', '6mo', '1y'
    
    // Format range for yahoo-finance2
    const period1 = new Date();
    if (range === '1mo') period1.setMonth(period1.getMonth() - 1);
    else if (range === '3mo') period1.setMonth(period1.getMonth() - 3);
    else if (range === '1y') period1.setFullYear(period1.getFullYear() - 1);
    else period1.setMonth(period1.getMonth() - 1); // default 1mo

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

// Trade execution logic will be moved to a controller, kept simple here to boot
app.post('/api/trade/execute', async (req, res) => {
  // We'll implement this directly in the React frontend via Supabase Client 
  // to avoid complex auth token passing if using RLS, or we can use Supabase Admin here.
  // For the hackathon, we'll let Frontend handle DB writes with RLS, and Socket.io is just for prices.
  res.json({ status: 'Endpoint deprecated: Use Supabase client directly in frontend for trades to leverage implicit RLS auth.' });
});

httpServer.listen(PORT, () => {
  console.log(`Node Backend with Socket.io running on port ${PORT}`);
});
