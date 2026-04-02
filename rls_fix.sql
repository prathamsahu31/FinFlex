-- ==========================================
-- FINFLEX RLS WRITE POLICY FIXES
-- ==========================================
-- CRITICAL: Without these policies, all writes to gamification,
-- stock_holdings, and stock_trades are SILENTLY REJECTED by Supabase.
-- Run this in your Supabase SQL Editor IMMEDIATELY.

-- ==========================================
-- 1. user_gamification — was SELECT-only
-- ==========================================
DROP POLICY IF EXISTS "Users can update own gamification" ON public.user_gamification;
CREATE POLICY "Users can update own gamification" ON public.user_gamification
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own gamification" ON public.user_gamification
;
CREATE POLICY "Users can insert own gamification" ON public.user_gamification
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ==========================================
-- 2. stock_holdings — was SELECT-only
-- ==========================================
DROP POLICY IF EXISTS "Users can insert own holdings" ON public.stock_holdings;
CREATE POLICY "Users can insert own holdings" ON public.stock_holdings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own holdings" ON public.stock_holdings;
CREATE POLICY "Users can update own holdings" ON public.stock_holdings
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own holdings" ON public.stock_holdings;
CREATE POLICY "Users can delete own holdings" ON public.stock_holdings
  FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- 3. stock_trades — was SELECT-only
-- ==========================================
DROP POLICY IF EXISTS "Users can insert own trades" ON public.stock_trades;
CREATE POLICY "Users can insert own trades" ON public.stock_trades
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- 4. Add 'name' and 'avatar_url' columns to profiles (if missing)
--    Required for Leaderboard display
-- ==========================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='name') THEN
    ALTER TABLE public.profiles ADD COLUMN name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='avatar_url') THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_url text;
  END IF;
END $$;

-- ==========================================
-- 5. Ensure user_gamification has a read-all policy for leaderboard
-- ==========================================
DROP POLICY IF EXISTS "Anyone can view gamification for leaderboard" ON public.user_gamification;
CREATE POLICY "Anyone can view gamification for leaderboard" ON public.user_gamification
  FOR SELECT USING (true);

-- NOTE: This replaces the old SELECT policy that was restricted to own user.
-- The leaderboard needs to read ALL users' XP to rank them.
-- Drop the old restrictive policy if it exists:
DROP POLICY IF EXISTS "Users can view own gamification" ON public.user_gamification;

-- ==========================================
-- VERIFICATION: Run these after applying, all should return rows:
-- ==========================================
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'user_gamification';
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'stock_holdings';
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'stock_trades';
