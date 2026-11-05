-- RLS check: proves one user cannot see or change another user's data.
--
-- HOW TO RUN (Supabase dashboard > SQL Editor):
--   1. Create two test users under Authentication > Users (Add user > Create new user).
--   2. Copy each user's UID and replace USER_A_ID and USER_B_ID below (keep the quotes).
--   3. Run the whole script.
-- If a check fails, you get an error starting with FAIL and nothing is saved.
-- If every check passes, the last line says so. The script always rolls back its test rows.

begin;

select set_config('test.a', 'USER_A_ID', true), set_config('test.b', 'USER_B_ID', true);
-- A category that belongs to A, remembered for the "forged reference" test.
select set_config('test.cat_a',
  (select id::text from public.categories
   where user_id = current_setting('test.a')::uuid and kind = 'expense' limit 1), true);

-- 0. The signup trigger worked: each user got default categories.
do $$ begin
  if (select count(*) from public.categories where user_id = current_setting('test.a')::uuid) < 10
  then raise exception 'FAIL: user A has no default categories (signup trigger?)'; end if;
end $$;

-- 1. A can insert and read their own transaction.
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('test.a'), 'role', 'authenticated')::text, true);
set local role authenticated;

insert into public.transactions (amount_minor, kind, occurred_on, note)
values (150000, 'expense', current_date, 'rls test from A');

do $$ begin
  if (select count(*) from public.transactions where note = 'rls test from A') <> 1
  then raise exception 'FAIL: A cannot read their own transaction'; end if;
end $$;

-- 2. B cannot see A's rows.
reset role;
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('test.b'), 'role', 'authenticated')::text, true);
set local role authenticated;

do $$ begin
  if (select count(*) from public.transactions where note = 'rls test from A') <> 0
  then raise exception 'FAIL: B can see A''s transaction'; end if;
  if (select count(*) from public.categories where user_id = current_setting('test.a')::uuid) <> 0
  then raise exception 'FAIL: B can see A''s categories'; end if;
end $$;

-- 3. B cannot write a row owned by A.
do $$ begin
  begin
    insert into public.transactions (user_id, amount_minor, kind, occurred_on)
    values (current_setting('test.a')::uuid, 100, 'expense', current_date);
    raise exception 'FAIL: B inserted a row owned by A';
  exception when insufficient_privilege then null; end;
end $$;

-- 4. B cannot change A's rows (the update silently matches zero rows).
do $$ declare n int; begin
  update public.transactions set note = 'hacked' where note = 'rls test from A';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: B updated A''s transaction'; end if;
end $$;

-- 5. B cannot attach A's category to B's own transaction (forged reference).
do $$ begin
  begin
    insert into public.transactions (amount_minor, kind, category_id, occurred_on)
    values (100, 'expense', current_setting('test.cat_a')::uuid, current_date);
    raise exception 'FAIL: B used A''s category';
  exception when foreign_key_violation then null; end;
end $$;

-- 6. Logged-out visitors get nothing.
reset role;
set local role anon;
do $$ begin
  begin
    perform count(*) from public.transactions;
    raise exception 'FAIL: anon can query transactions';
  exception when insufficient_privilege then null; end;
end $$;

reset role;
rollback;

select 'ALL RLS CHECKS PASSED (nothing was saved)' as result;
