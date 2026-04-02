-- ==========================================
-- FINFLEX FUNCTIONAL ENHANCEMENTS SETUP
-- ==========================================
-- This script adds persistence for Punishment, Subscriptions, and Flashcards.
-- Run this in your Supabase SQL Editor.

-- 1. Punishment Contracts Table
CREATE TABLE IF NOT EXISTS public.punishment_contracts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  goal text NOT NULL,
  pledge_amount numeric NOT NULL,
  anti_charity text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.punishment_contracts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own punishment contracts" ON public.punishment_contracts;
CREATE POLICY "Users can manage own punishment contracts" ON public.punishment_contracts FOR ALL USING (auth.uid() = user_id);

-- 2. Manual Subscriptions Table
CREATE TABLE IF NOT EXISTS public.manual_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  price numeric NOT NULL,
  billing_cycle text DEFAULT 'Monthly',
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.manual_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own manual subscriptions" ON public.manual_subscriptions;
CREATE POLICY "Users can manage own manual subscriptions" ON public.manual_subscriptions FOR ALL USING (auth.uid() = user_id);

-- 3. Flashcard Progress Table
CREATE TABLE IF NOT EXISTS public.flashcard_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  card_id uuid REFERENCES public.flashcards ON DELETE CASCADE NOT NULL,
  is_mastered boolean DEFAULT true,
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, card_id)
);

ALTER TABLE public.flashcard_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own flashcard progress" ON public.flashcard_progress;
CREATE POLICY "Users can manage own flashcard progress" ON public.flashcard_progress FOR ALL USING (auth.uid() = user_id);
