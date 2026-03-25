-- User Profiles (Automatically created after signup)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  fire_target numeric default 10000000,
  age integer,
  monthly_income numeric(12, 2) default 0,
  household_income numeric(12, 2) default 0,
  current_savings numeric(12, 2) default 0,
  monthly_expenses numeric(12, 2) default 0,
  risk_tolerance text default 'medium',
  onboarding_completed boolean default false,
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Automate profile creation on new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Note: Trigger creation might fail if it already exists. 
-- You may need to DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users; first.
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'on_auth_user_created') then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute procedure public.handle_new_user();
  end if;
end $$;

-- Transactions Table
create table if not exists transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  amount numeric not null,
  vendor text not null,
  category text not null,
  type text not null check (type in ('income', 'expense')),
  date timestamp with time zone default timezone('utc'::text, now()),
  is_gig boolean default false,
  custom_tag text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Portfolio Assets Table
create table if not exists portfolio_assets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  symbol text not null,
  name text,
  shares numeric not null,
  average_price numeric,
  current_price numeric,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Bill Splits Table
create table if not exists bill_splits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  group_name text not null,
  total_amount numeric not null,
  split_details jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Flex Decks Table
create table if not exists flex_decks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Flashcards Table
create table if not exists flashcards (
  id uuid default gen_random_uuid() primary key,
  deck_id uuid references flex_decks on delete cascade not null,
  front_text text not null,
  back_text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Set up Row Level Security (RLS)

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table transactions enable row level security;
alter table portfolio_assets enable row level security;
alter table bill_splits enable row level security;
alter table flex_decks enable row level security;
alter table flashcards enable row level security;

-- Create Policies

drop policy if exists "Users can view own profile" on profiles;
create policy "Users can view own profile" 
  on profiles for select using (auth.uid() = id);

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile" 
  on profiles for update using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on profiles;
create policy "Users can insert own profile" 
  on profiles for insert with check (auth.uid() = id);

drop policy if exists "Users can sync own transactions" on transactions;
create policy "Users can sync own transactions" 
  on transactions for all using (auth.uid() = user_id);

drop policy if exists "Users can manage own assets" on portfolio_assets;
create policy "Users can manage own assets" 
  on portfolio_assets for all using (auth.uid() = user_id);

drop policy if exists "Users can manage own bill splits" on bill_splits;
create policy "Users can manage own bill splits" 
  on bill_splits for all using (auth.uid() = user_id);

drop policy if exists "Users can manage own decks" on flex_decks;
create policy "Users can manage own decks" 
  on flex_decks for all using (auth.uid() = user_id);

drop policy if exists "Users can manage own cards via deck ownership" on flashcards;
create policy "Users can manage own cards via deck ownership" 
  on flashcards for all using (
    exists (
      select 1 from flex_decks 
      where flex_decks.id = flashcards.deck_id 
      and flex_decks.user_id = auth.uid()
    )
  );
