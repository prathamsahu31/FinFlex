-- ==========================================
-- FINFLEX COMPLETE SEED DATA
-- ==========================================
-- Run this AFTER running supabase_setup.sql, database_schema_update.sql, and rls_fix.sql
-- This inserts demo data for ALL tables so every feature works immediately.
--
-- INSTRUCTIONS: 
-- 1. Sign up a user in FinFlex first (so auth.users has your user)
-- 2. Copy your user UUID from Supabase Auth dashboard
-- 3. Replace ALL occurrences of 'YOUR_USER_ID_HERE' with your actual user UUID
-- 4. Run this SQL in your Supabase SQL Editor

-- ==========================================
-- STEP 0: Set your user ID here (replace this with your actual UUID)
-- ==========================================
DO $$
DECLARE
  uid uuid := 'YOUR_USER_ID_HERE';  -- ⚠️ REPLACE THIS WITH YOUR REAL USER ID
BEGIN

-- ==========================================
-- 1. PROFILE DATA (Budget, FIRE, Risk Settings)
-- ==========================================
UPDATE public.profiles SET
  name = 'Pratham',
  age = 20,
  monthly_income = 50000.00,
  household_income = 120000.00,
  current_savings = 200000.00,
  monthly_expenses = 30000.00,
  fire_target = 10000000,
  risk_tolerance = 'high',
  onboarding_completed = true,
  updated_at = now()
WHERE id = uid;

-- ==========================================
-- 2. TRANSACTIONS (30 realistic entries - income + expenses)
-- ==========================================
DELETE FROM public.transactions WHERE user_id = uid;

-- Income entries
INSERT INTO public.transactions (user_id, amount, vendor, category, type, date) VALUES
  (uid, 50000.00, 'Infosys', 'Salary', 'income', now() - interval '1 day'),
  (uid, 50000.00, 'Infosys', 'Salary', 'income', now() - interval '31 days'),
  (uid, 5000.00, 'Freelance Web Dev', 'Salary', 'income', now() - interval '10 days'),
  (uid, 3000.00, 'Upwork Project', 'Salary', 'income', now() - interval '20 days'),
  (uid, 1500.00, 'Stock Dividend', 'Salary', 'income', now() - interval '14 days');

-- Expense entries - diverse categories
INSERT INTO public.transactions (user_id, amount, vendor, category, type, date, is_gig) VALUES
  (uid, 15000.00, 'Landlord', 'Rent & Bills', 'expense', now() - interval '2 days', false),
  (uid, 3500.00, 'Electricity Board', 'Rent & Bills', 'expense', now() - interval '5 days', false),
  (uid, 999.00, 'Netflix', 'Entertainment', 'expense', now() - interval '3 days', false),
  (uid, 199.00, 'Spotify', 'Entertainment', 'expense', now() - interval '3 days', false),
  (uid, 499.00, 'Amazon Prime', 'Entertainment', 'expense', now() - interval '7 days', false),
  (uid, 2500.00, 'Zomato', 'Food & Dining', 'expense', now() - interval '1 day', false),
  (uid, 1800.00, 'Swiggy', 'Food & Dining', 'expense', now() - interval '4 days', false),
  (uid, 650.00, 'Starbucks', 'Food & Dining', 'expense', now() - interval '6 days', false),
  (uid, 350.00, 'Street Food', 'Food & Dining', 'expense', now() - interval '8 days', false),
  (uid, 4500.00, 'Myntra', 'Shopping', 'expense', now() - interval '9 days', false),
  (uid, 2999.00, 'Amazon', 'Shopping', 'expense', now() - interval '12 days', false),
  (uid, 1299.00, 'Flipkart', 'Shopping', 'expense', now() - interval '15 days', false),
  (uid, 800.00, 'Uber', 'Transport', 'expense', now() - interval '2 days', false),
  (uid, 500.00, 'Metro Card', 'Transport', 'expense', now() - interval '10 days', false),
  (uid, 1200.00, 'Ola', 'Transport', 'expense', now() - interval '14 days', false),
  (uid, 399.00, 'Adobe CC', 'Shopping', 'expense', now() - interval '11 days', false),
  (uid, 299.00, 'iCloud', 'Other', 'expense', now() - interval '16 days', false),
  (uid, 5000.00, 'Mutual Fund SIP', 'Other', 'expense', now() - interval '1 day', false),
  (uid, 2000.00, 'Gym Membership', 'Other', 'expense', now() - interval '30 days', false),
  (uid, 1500.00, 'Movie Night', 'Entertainment', 'expense', now() - interval '18 days', false),
  -- Gig economy tagged entries
  (uid, 1200.00, 'Fiverr Payout', 'Salary', 'income', now() - interval '22 days', true),
  (uid, 800.00, 'Logo Design', 'Salary', 'income', now() - interval '25 days', true),
  -- Older transactions for chart history
  (uid, 50000.00, 'Infosys', 'Salary', 'income', now() - interval '60 days', false),
  (uid, 12000.00, 'Rent', 'Rent & Bills', 'expense', now() - interval '62 days', false),
  (uid, 3200.00, 'Grocery', 'Food & Dining', 'expense', now() - interval '45 days', false);

-- ==========================================
-- 3. GAMIFICATION (Virtual Coins, XP, Level)
-- ==========================================
INSERT INTO public.user_gamification (id, coins, xp, level, updated_at) 
VALUES (uid, 10000.00, 750, 2, now())
ON CONFLICT (id) DO UPDATE SET coins = 10000.00, xp = 750, level = 2, updated_at = now();

-- ==========================================
-- 4. STOCK HOLDINGS (Pre-owned portfolio)
-- ==========================================
DELETE FROM public.stock_holdings WHERE user_id = uid;

INSERT INTO public.stock_holdings (user_id, symbol, total_quantity, avg_buy_price) VALUES
  (uid, 'AAPL', 5, 178.50),
  (uid, 'TSLA', 2, 242.30),
  (uid, 'BTC', 0.1, 62500.00),
  (uid, 'ETH', 1.5, 3200.00),
  (uid, 'NVDA', 3, 875.00);

-- ==========================================
-- 5. STOCK TRADES (Transaction history)
-- ==========================================
DELETE FROM public.stock_trades WHERE user_id = uid;

INSERT INTO public.stock_trades (user_id, symbol, type, quantity, price_at_execution, timestamp) VALUES
  (uid, 'AAPL', 'BUY', 5, 178.50, now() - interval '15 days'),
  (uid, 'TSLA', 'BUY', 3, 235.00, now() - interval '12 days'),
  (uid, 'TSLA', 'SELL', 1, 248.75, now() - interval '5 days'),
  (uid, 'BTC', 'BUY', 0.1, 62500.00, now() - interval '20 days'),
  (uid, 'ETH', 'BUY', 2, 3100.00, now() - interval '18 days'),
  (uid, 'ETH', 'SELL', 0.5, 3450.00, now() - interval '3 days'),
  (uid, 'NVDA', 'BUY', 3, 875.00, now() - interval '7 days');

-- ==========================================
-- 6. FLEX DECKS & FLASHCARDS (Financial Education)
-- ==========================================
-- Remove old ones for this user
DELETE FROM public.flashcard_progress WHERE user_id = uid;
DELETE FROM public.flashcards WHERE deck_id IN (SELECT id FROM public.flex_decks WHERE user_id = uid);
DELETE FROM public.flex_decks WHERE user_id = uid;

-- Create two decks
INSERT INTO public.flex_decks (id, user_id, title, description) VALUES
  (gen_random_uuid(), uid, 'General Finance', 'Core financial concepts every investor should know'),
  (gen_random_uuid(), uid, 'Indian Markets', 'India-specific financial knowledge');

-- Insert cards for General Finance deck
INSERT INTO public.flashcards (deck_id, front_text, back_text)
SELECT d.id, cards.front, cards.back
FROM public.flex_decks d,
(VALUES
  ('The 50/30/20 Rule', 'A simple budgeting framework: 50% for needs (rent, groceries), 30% for wants (dining, shopping), and 20% for savings & investments.'),
  ('Compound Interest', 'Interest earned on interest. ₹10,000/month at 12% for 20 years = over ₹1 Crore. Start early — time is your superpower.'),
  ('Emergency Fund', 'Save 3-6 months of expenses in a high-yield savings account. This is your financial safety net before investing.'),
  ('Index Funds', 'Buying individual stocks is risky. An index fund (like Nifty 50) lets you own a tiny piece of 50 top companies at once.'),
  ('Dollar Cost Averaging', 'Invest a fixed amount regularly regardless of price. You buy more shares when cheap, fewer when expensive — smoothing out risk.'),
  ('Rule of 72', 'Divide 72 by the annual return rate to estimate how many years your money takes to double. At 12% return: 72/12 = 6 years.'),
  ('Asset Allocation', 'Don''t put all eggs in one basket. Split investments across stocks (high risk), bonds (medium), and FDs (low risk) based on your age and goals.'),
  ('FIRE Movement', 'Financial Independence, Retire Early. Save 50-70% of income, invest aggressively, and build a corpus 25x your annual expenses.')
) AS cards(front, back)
WHERE d.user_id = uid AND d.title = 'General Finance';

-- Insert cards for Indian Markets deck
INSERT INTO public.flashcards (deck_id, front_text, back_text)
SELECT d.id, cards.front, cards.back
FROM public.flex_decks d,
(VALUES
  ('NIFTY 50', 'India''s benchmark stock index tracking the top 50 companies by market cap on NSE. It''s like the S&P 500 of India.'),
  ('SIP (Systematic Investment Plan)', 'Invest a fixed amount monthly in mutual funds. Even ₹500/month can grow to lakhs over 15-20 years thanks to compounding.'),
  ('PPF (Public Provident Fund)', 'Government-backed savings scheme with 7.1% tax-free interest. Lock-in: 15 years. Safe, but not liquid. Great for long-term goals.'),
  ('Section 80C', 'Save up to ₹1.5 lakh/year in tax by investing in ELSS, PPF, NPS, or paying tuition fees and home loan principal.'),
  ('UPI & Digital Finance', 'India leads the world in real-time digital payments. UPI processed 12+ billion transactions/month in 2025. Financial inclusion in action.')
) AS cards(front, back)
WHERE d.user_id = uid AND d.title = 'Indian Markets';

-- Mark a couple cards as mastered
INSERT INTO public.flashcard_progress (user_id, card_id, is_mastered)
SELECT uid, f.id, true
FROM public.flashcards f
JOIN public.flex_decks d ON f.deck_id = d.id
WHERE d.user_id = uid
LIMIT 2;

-- ==========================================
-- 7. PUNISHMENT CONTRACTS
-- ==========================================
DELETE FROM public.punishment_contracts WHERE user_id = uid;

INSERT INTO public.punishment_contracts (user_id, goal, pledge_amount, anti_charity, is_active) VALUES
  (uid, 'No ordering food delivery for 1 week', 2000, 'Do not eat your favorite food for a week', true);

-- ==========================================
-- 8. MANUAL SUBSCRIPTIONS
-- ==========================================
DELETE FROM public.manual_subscriptions WHERE user_id = uid;

INSERT INTO public.manual_subscriptions (user_id, name, price, billing_cycle) VALUES
  (uid, 'Netflix Premium', 649, 'Monthly'),
  (uid, 'Spotify Family', 179, 'Monthly'),
  (uid, 'Amazon Prime', 1499, 'Yearly'),
  (uid, 'ChatGPT Plus', 1700, 'Monthly'),
  (uid, 'Gym Membership', 2000, 'Monthly'),
  (uid, 'iCloud 200GB', 299, 'Monthly');

-- ==========================================
-- 9. BILL SPLITS
-- ==========================================
DELETE FROM public.bill_splits WHERE user_id = uid;

INSERT INTO public.bill_splits (user_id, group_name, total_amount, split_details) VALUES
  (uid, 'Roommates - April Rent', 45000, '{"members": [{"name": "You", "share": 15000, "paid": true}, {"name": "Rahul", "share": 15000, "paid": false}, {"name": "Priya", "share": 15000, "paid": true}]}'),
  (uid, 'Dinner at Olive', 4200, '{"members": [{"name": "You", "share": 1400, "paid": true}, {"name": "Ankit", "share": 1400, "paid": false}, {"name": "Neha", "share": 1400, "paid": false}]}'),
  (uid, 'Road Trip Fuel', 3000, '{"members": [{"name": "You", "share": 750, "paid": true}, {"name": "Vikram", "share": 750, "paid": true}, {"name": "Shreya", "share": 750, "paid": false}, {"name": "Deepak", "share": 750, "paid": false}]}');

-- ==========================================
-- 10. SITE STATS (Global Visitor Counter)
-- ==========================================
INSERT INTO public.site_stats (id, count)
VALUES ('visitor_count', 1247)
ON CONFLICT (id) DO UPDATE SET count = 1247;

-- ==========================================
-- 11. PORTFOLIO ASSETS (Legacy table - if used)
-- ==========================================
DELETE FROM public.portfolio_assets WHERE user_id = uid;

INSERT INTO public.portfolio_assets (user_id, symbol, name, shares, average_price, current_price) VALUES
  (uid, 'AAPL', 'Apple Inc.', 5, 178.50, 195.00),
  (uid, 'TSLA', 'Tesla, Inc.', 2, 242.30, 255.00),
  (uid, 'NVDA', 'NVIDIA Corp.', 3, 875.00, 920.00);

END $$;

-- ==========================================
-- VERIFICATION: After running, check data exists:
-- ==========================================
-- SELECT count(*) FROM public.transactions;    -- Should be 25+
-- SELECT count(*) FROM public.stock_holdings;   -- Should be 5
-- SELECT count(*) FROM public.stock_trades;     -- Should be 7
-- SELECT count(*) FROM public.flashcards;       -- Should be 13
-- SELECT count(*) FROM public.manual_subscriptions; -- Should be 6
-- SELECT * FROM public.user_gamification;       -- Should show coins, xp, level
