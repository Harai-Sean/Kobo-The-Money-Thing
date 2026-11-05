-- Kobo initial schema. Money is integer KOBO (bigint). Every table has Row Level Security.

create type public.txn_kind as enum ('expense', 'income');

-- ---------------------------------------------------------------- tables

create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  created_at   timestamptz not null default now()
);

create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 40),
  kind        public.txn_kind not null,
  color       text not null default '#1f6f4a',
  icon        text not null default 'tag',
  sort_order  int  not null default 0,
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  unique (user_id, kind, name),
  -- These two let other tables point at (category, owner[, kind]) so a row can never
  -- reference somebody else's category, or an income category from an expense.
  unique (id, user_id),
  unique (id, user_id, kind)
);

create table public.category_rules (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  keyword     text not null check (keyword = lower(keyword) and char_length(keyword) between 1 and 40),
  category_id uuid not null,
  created_at  timestamptz not null default now(),
  unique (user_id, keyword),
  foreign key (category_id, user_id) references public.categories (id, user_id) on delete cascade
);

create table public.transactions (
  id           uuid primary key default gen_random_uuid(), -- the app may supply its own
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  amount_minor bigint not null check (amount_minor > 0 and amount_minor <= 100000000000),
  kind         public.txn_kind not null,
  category_id  uuid, -- optional: "uncategorised" is allowed
  note         text not null default '' check (char_length(note) <= 200),
  occurred_on  date not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz, -- soft delete: powers undo, keeps the door open for sync
  -- Category must belong to the same user AND have the same kind. (A NULL category_id skips this.)
  foreign key (category_id, user_id, kind) references public.categories (id, user_id, kind)
);

create index transactions_user_date_idx
  on public.transactions (user_id, occurred_on desc) where deleted_at is null;

-- ---------------------------------------------------------------- updated_at

create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- RLS

alter table public.profiles       enable row level security;
alter table public.categories     enable row level security;
alter table public.category_rules enable row level security;
alter table public.transactions   enable row level security;

-- Logged-out visitors (role "anon") get no access at all.
revoke all on public.profiles, public.categories, public.category_rules, public.transactions
  from anon;

-- (select auth.uid()) is evaluated once per query instead of once per row: faster.
create policy "own profile: read"   on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
create policy "own profile: update" on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "own categories: read"   on public.categories for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "own categories: insert" on public.categories for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "own categories: update" on public.categories for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own categories: delete" on public.categories for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "own rules: read"   on public.category_rules for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "own rules: insert" on public.category_rules for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "own rules: update" on public.category_rules for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own rules: delete" on public.category_rules for delete to authenticated
  using ((select auth.uid()) = user_id);

-- No DELETE policy on transactions: the app soft-deletes by setting deleted_at.
create policy "own transactions: read"   on public.transactions for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "own transactions: insert" on public.transactions for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "own transactions: update" on public.transactions for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------- new-user setup

-- Runs whenever an account is created (including from the Supabase dashboard).
-- SECURITY DEFINER = runs with the owner's rights so it can write to our tables;
-- the empty search_path stops anyone hijacking it through look-alike objects.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''));

  insert into public.categories (user_id, name, kind, color, sort_order)
  select new.id, c.name, c.kind::public.txn_kind, c.color, c.sort_order
  from (values
    ('Food and groceries', 'expense', '#2e7d5b', 10),
    ('Eating out',         'expense', '#d9822b', 20),
    ('Transport',          'expense', '#3b6ea8', 30),
    ('Airtime and data',   'expense', '#7a5cb8', 40),
    ('Utilities',          'expense', '#c2a21a', 50),
    ('Rent and housing',   'expense', '#8a5a44', 60),
    ('Health',             'expense', '#c0463d', 70),
    ('Family support',     'expense', '#2a9aa0', 80),
    ('Shopping',           'expense', '#b5538a', 90),
    ('Entertainment',      'expense', '#5a7d2a', 100),
    ('Education',          'expense', '#4a5fb0', 110),
    ('Fees and charges',   'expense', '#6b7280', 120),
    ('Other',              'expense', '#9a9a8a', 130),
    ('Salary',             'income',  '#1f6f4a', 10),
    ('Business',           'income',  '#2a8a6a', 20),
    ('Gifts',              'income',  '#b5538a', 30),
    ('Other income',       'income',  '#9a9a8a', 40)
  ) as c(name, kind, color, sort_order);

  -- Starter keyword rules. The app adds more as the user corrects categories.
  insert into public.category_rules (user_id, keyword, category_id)
  select new.id, r.keyword, cat.id
  from (values
    ('bolt','Transport'), ('uber','Transport'), ('indrive','Transport'), ('fuel','Transport'),
    ('petrol','Transport'), ('mtn','Airtime and data'), ('airtel','Airtime and data'),
    ('glo','Airtime and data'), ('data','Airtime and data'), ('airtime','Airtime and data'),
    ('dstv','Utilities'), ('gotv','Utilities'), ('electricity','Utilities'),
    ('shoprite','Food and groceries'), ('groceries','Food and groceries'),
    ('lunch','Eating out'), ('dinner','Eating out'), ('breakfast','Eating out'),
    ('suya','Eating out'), ('rent','Rent and housing'), ('fee','Fees and charges'),
    ('charge','Fees and charges'), ('stamp','Fees and charges')
  ) as r(keyword, category_name)
  join public.categories cat
    on cat.user_id = new.id and cat.kind = 'expense' and cat.name = r.category_name;

  insert into public.category_rules (user_id, keyword, category_id)
  select new.id, 'salary', cat.id
  from public.categories cat
  where cat.user_id = new.id and cat.kind = 'income' and cat.name = 'Salary';

  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
