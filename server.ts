import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import TelegramBot from "node-telegram-bot-api";
import { createClient } from '@supabase/supabase-js';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

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
      bot?.sendMessage(chatId, "Welcome to FinFlex Clawbot! Send me your expenses like: '50 for groceries' and I will log them. Make sure your Telegram ID is linked in your FinFlex account.");
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

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
