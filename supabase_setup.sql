-- ==========================================
-- FINFLEX ULTIMATE SUPABASE SETUP
-- ==========================================
-- This script will set up all tables, triggers, storage, and RLS policies.

-- OPTIONAL: Clean Up Obsolete/Old Tables
-- DROP TABLE IF EXISTS public.flare_decks CASCADE;
-- DROP TABLE IF EXISTS public.flashcards CASCADE;
-- DROP TABLE IF EXISTS public.flex_decks CASCADE;
-- DROP TABLE IF EXISTS public.bill_splits CASCADE;
-- DROP TABLE IF EXISTS public.portfolio_assets CASCADE;
-- DROP TABLE IF EXISTS public.transactions CASCADE;
-- DROP TABLE IF EXISTS public.profiles CASCADE;

-- 1. User Profiles (Automatically created after signup)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  fire_target numeric DEFAULT 10000000,
  age integer,
  monthly_income numeric(12, 2) DEFAULT 0,
  household_income numeric(12, 2) DEFAULT 0,
  current_savings numeric(12, 2) DEFAULT 0,
  monthly_expenses numeric(12, 2) DEFAULT 0,
  risk_tolerance text DEFAULT 'medium',
  onboarding_completed boolean DEFAULT false,
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Automate profile creation on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
  END IF;
END $$;

-- 3. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL,
  vendor text NOT NULL,
  category text NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  date timestamp with time zone DEFAULT now(),
  is_gig boolean DEFAULT false,
  custom_tag text,
  created_at timestamp with time zone DEFAULT now()
);

-- 4. Portfolio Assets Table
CREATE TABLE IF NOT EXISTS public.portfolio_assets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  symbol text NOT NULL,
  name text,
  shares numeric NOT NULL,
  average_price numeric,
  current_price numeric,
  created_at timestamp with time zone DEFAULT now()
);

-- 5. Bill Splits Table
CREATE TABLE IF NOT EXISTS public.bill_splits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  group_name text NOT NULL,
  total_amount numeric NOT NULL,
  split_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- 6. Flex Decks Table
CREATE TABLE IF NOT EXISTS public.flex_decks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now()
);

-- 7. Flashcards Table
CREATE TABLE IF NOT EXISTS public.flashcards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  deck_id uuid REFERENCES public.flex_decks ON DELETE CASCADE NOT NULL,
  front_text text NOT NULL,
  back_text text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flex_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Transactions Policies
DROP POLICY IF EXISTS "Users can manage own transactions" ON public.transactions;
CREATE POLICY "Users can manage own transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id);

-- Portfolio Policies
DROP POLICY IF EXISTS "Users can manage own assets" ON public.portfolio_assets;
CREATE POLICY "Users can manage own assets" ON public.portfolio_assets FOR ALL USING (auth.uid() = user_id);

-- Bill Splits Policies
DROP POLICY IF EXISTS "Users can manage own bill splits" ON public.bill_splits;
CREATE POLICY "Users can manage own bill splits" ON public.bill_splits FOR ALL USING (auth.uid() = user_id);

-- Decks & Flashcards Policies
DROP POLICY IF EXISTS "Users can manage own decks" ON public.flex_decks;
CREATE POLICY "Users can manage own decks" ON public.flex_decks FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own cards" ON public.flashcards;
CREATE POLICY "Users can manage own cards" ON public.flashcards FOR ALL USING (
  EXISTS (SELECT 1 FROM public.flex_decks WHERE flex_decks.id = flashcards.deck_id AND flex_decks.user_id = auth.uid())
);

-- ==========================================
-- STORAGE SETUP (FOR RECEIPTS)
-- ==========================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload own receipts" ON storage.objects;
CREATE POLICY "Users can upload own receipts" ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text );

DROP POLICY IF EXISTS "Receipts are public" ON storage.objects;
CREATE POLICY "Receipts are public" ON storage.objects FOR SELECT USING ( bucket_id = 'receipts' );
