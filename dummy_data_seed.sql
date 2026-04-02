-- ==============================================================================
-- FINFLEX DUMMY DATA SEEDER
-- ==============================================================================
-- INSTRUCTIONS:
-- 1. Go to your Supabase Dashboard -> Authentication -> Users.
-- 2. Copy the "User UID" of the account you want to use for the presentation.
-- 3. Replace the 'YOUR_USER_ID_HERE' string below with that copied UUID.
-- 4. Click "Run" in the Supabase SQL Editor.
-- ==============================================================================

DO $$
DECLARE
    -- 👇 PASTE YOUR ACTUAL SUPABASE USER ID HERE 👇
    demo_user_id uuid := '00000000-0000-0000-0000-000000000000'; 
BEGIN

    -- 1. UPGRADE GAMIFICATION STATUS FOR DEMO
    -- (Makes the presentation look like an active user)
    INSERT INTO public.user_gamification (id, coins, xp, level, updated_at)
    VALUES (demo_user_id, 35400.50, 4800, 5, NOW())
    ON CONFLICT (id) DO UPDATE 
    SET coins = 35400.50, xp = 4800, level = 5, updated_at = NOW();

    -- 2. CLEAR EXISTING DEMO DATA (To avoid duplicates if you run this twice)
    DELETE FROM public.transactions WHERE user_id = demo_user_id;
    DELETE FROM public.stock_holdings WHERE user_id = demo_user_id;
    DELETE FROM public.stock_trades WHERE user_id = demo_user_id;

    -- 3. SEED REALISTIC TRANSACTIONS (For Income/Expense Charts)
    INSERT INTO public.transactions (user_id, amount, vendor, category, type, date) VALUES
    (demo_user_id, 45000, 'TCS Salary', 'Income', 'income', NOW() - INTERVAL '5 days'),
    (demo_user_id, 12000, 'Freelance Web Dev', 'Income', 'income', NOW() - INTERVAL '3 days'),
    (demo_user_id, 1500, 'Uber Rides', 'Transport', 'expense', NOW() - INTERVAL '4 days'),
    (demo_user_id, 850, 'Zomato', 'Food', 'expense', NOW() - INTERVAL '2 days'),
    (demo_user_id, 450, 'Starbucks', 'Food', 'expense', NOW() - INTERVAL '1 days'),
    (demo_user_id, 2999, 'Amazon AWS', 'Subscriptions', 'expense', NOW() - INTERVAL '3 days'),
    (demo_user_id, 6500, 'Nike Air Force', 'Shopping', 'expense', NOW() - INTERVAL '5 days'),
    (demo_user_id, 200, 'Blinkit Groceries', 'Food', 'expense', NOW() - INTERVAL '1 hours');

    -- 4. SEED HYBRID PORTFOLIO (Crypto & Equities)
    INSERT INTO public.stock_holdings (user_id, symbol, total_quantity, avg_buy_price) VALUES
    (demo_user_id, 'BTC', 0.15, 62000.00),
    (demo_user_id, 'ETH', 2.5, 3100.00),
    (demo_user_id, 'TSLA', 15, 175.50),
    (demo_user_id, 'NVDA', 5, 850.20);

    -- 5. SEED RECENT STOCK ACTIVITY (For Trading History)
    INSERT INTO public.stock_trades (user_id, symbol, type, quantity, price_at_execution, timestamp) VALUES
    (demo_user_id, 'BTC', 'BUY', 0.15, 62000.00, NOW() - INTERVAL '10 days'),
    (demo_user_id, 'ETH', 'BUY', 2.5, 3100.00, NOW() - INTERVAL '8 days'),
    (demo_user_id, 'TSLA', 'BUY', 15, 175.50, NOW() - INTERVAL '5 days'),
    (demo_user_id, 'NVDA', 'BUY', 5, 850.20, NOW() - INTERVAL '2 days');

END $$;
