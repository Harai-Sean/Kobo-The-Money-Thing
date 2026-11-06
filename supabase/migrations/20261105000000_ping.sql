-- A tiny public function used only by the keep-alive workflow (.github/workflows/keepalive.yml).
-- It returns 1 and touches no data, but calling it counts as database activity, which stops the
-- free Supabase project from being paused for inactivity.
create function public.ping() returns int
language sql stable set search_path = '' as $$ select 1 $$;

grant execute on function public.ping() to anon, authenticated;
