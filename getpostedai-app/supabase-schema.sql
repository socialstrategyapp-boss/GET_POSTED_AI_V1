-- Get Posted AI — Supabase Schema
-- Run this in Supabase SQL Editor

-- ── PROFILES ─────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  business_name text,
  website text,
  owner_first_name text,
  owner_last_name text,
  phone text,
  address text,
  country text default 'Australia',
  timezone text default 'Australia/Sydney',
  business_size text,
  industry text,
  industry_code text,
  sells text,
  audience text,
  brand_voice text,
  content_pref text,
  desc1 text,
  desc2 text,
  desc3 text,
  instagram text,
  tiktok text,
  facebook text,
  youtube text,
  linkedin text,
  x_twitter text,
  pinterest text,
  logo_url text,
  banner_url text,
  owner_photo_url text,
  plan text default 'starter',
  credits integer default 300,
  credits_reset_at timestamptz default (now() + interval '30 days'),
  onboarding_done boolean default false,
  welcome_tour_done boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── INTELLIGENCE ─────────────────────────────────────────────────────────────
create table if not exists public.intelligence (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  briefing_package jsonb,
  sub_industry text,
  industry_code text,
  scan_version integer default 1,
  scanned_at timestamptz default now(),
  created_at timestamptz default now()
);

-- ── STUDIO SESSIONS ───────────────────────────────────────────────────────────
create table if not exists public.studio_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  content_type text,
  platform text,
  answers jsonb,
  generated_content text,
  generated_image_url text,
  generated_video_url text,
  status text default 'draft',
  credits_used integer default 0,
  created_at timestamptz default now()
);

-- ── CREDIT LEDGER ─────────────────────────────────────────────────────────────
create table if not exists public.credit_ledger (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  amount integer not null,
  type text not null, -- 'earn' | 'spend' | 'topup' | 'reset'
  description text,
  balance_after integer,
  created_at timestamptz default now()
);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.intelligence enable row level security;
alter table public.studio_sessions enable row level security;
alter table public.credit_ledger enable row level security;

-- Profiles: users can only see/edit their own
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Intelligence: users can only see their own
create policy "intelligence_select_own" on public.intelligence for select using (auth.uid() = user_id);
create policy "intelligence_insert_own" on public.intelligence for insert with check (auth.uid() = user_id);
create policy "intelligence_update_own" on public.intelligence for update using (auth.uid() = user_id);

-- Studio sessions
create policy "studio_select_own" on public.studio_sessions for select using (auth.uid() = user_id);
create policy "studio_insert_own" on public.studio_sessions for insert with check (auth.uid() = user_id);
create policy "studio_update_own" on public.studio_sessions for update using (auth.uid() = user_id);

-- Credit ledger: read own, server writes
create policy "ledger_select_own" on public.credit_ledger for select using (auth.uid() = user_id);

-- ── AUTO-CREATE PROFILE ON SIGNUP ─────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, plan, credits)
  values (new.id, new.email, 'starter', 300)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── UPDATED_AT AUTO-TRIGGER ────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();
