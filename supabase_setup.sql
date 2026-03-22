-- User Profiles (Automatically created after signup)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  fire_target numeric default 1000000,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Automate profile creation on new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Transactions Table
create table transactions (
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
create table portfolio_assets (
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
create table bill_splits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  group_name text not null,
  total_amount numeric not null,
  split_details jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Flex Decks Table
create table flex_decks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Flashcards Table
create table flashcards (
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

create policy "Users can view own profile" 
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile" 
  on profiles for update using (auth.uid() = id);

create policy "Users can sync own transactions" 
  on transactions for all using (auth.uid() = user_id);

create policy "Users can manage own assets" 
  on portfolio_assets for all using (auth.uid() = user_id);

create policy "Users can manage own bill splits" 
  on bill_splits for all using (auth.uid() = user_id);

create policy "Users can manage own decks" 
  on flex_decks for all using (auth.uid() = user_id);

create policy "Users can manage own cards via deck ownership" 
  on flashcards for all using (
    exists (
      select 1 from flex_decks 
      where flex_decks.id = flashcards.deck_id 
      and flex_decks.user_id = auth.uid()
    )
  );
