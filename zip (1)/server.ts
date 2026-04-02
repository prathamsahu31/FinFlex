import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Search stocks
  app.get('/api/search/:query', async (req, res) => {
    try {
      const query = req.params.query;
      const results = await yahooFinance.search(query);
      // Filter for equities to keep it simple
      const equities = results.quotes.filter(q => q.quoteType === 'EQUITY' || q.quoteType === 'ETF');
      res.json(equities.slice(0, 10));
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Failed to search stocks' });
    }
  });

  // Get stock quote
  app.get('/api/quote/:symbol', async (req, res) => {
    try {
      const symbol = req.params.symbol;
      const quote = await yahooFinance.quote(symbol);
      res.json(quote);
    } catch (error) {
      console.error(`Quote error for ${req.params.symbol}:`, error);
      res.status(500).json({ error: 'Failed to fetch quote' });
    }
  });

  // Get historical chart data
  app.get('/api/chart/:symbol', async (req, res) => {
    try {
      const symbol = req.params.symbol;
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
    } catch (error) {
      console.error(`Chart error for ${req.params.symbol}:`, error);
      res.status(500).json({ error: 'Failed to fetch chart data' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
