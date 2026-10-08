-- In Supabase SQL Editor: run this entire file once.
-- Also enable Authentication > Sign In / Providers > Anonymous Sign-Ins.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null check (nickname ~ '^[A-Za-z0-9_.-]{2,16}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_nickname_lower_unique
  on public.profiles (lower(nickname));

create table if not exists public.games (
  player_id uuid not null references public.profiles (id) on delete cascade,
  game_id uuid not null,
  solved boolean not null,
  attempts smallint not null check (attempts between 1 and 6),
  created_at timestamptz not null default now(),
  primary key (player_id, game_id),
  check (solved or attempts = 6)
);

alter table public.profiles enable row level security;
alter table public.games enable row level security;
revoke all on public.profiles, public.games from anon, authenticated;

create or replace function public.set_nickname(p_nickname text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  cleaned_nickname text := btrim(p_nickname);
begin
  if current_user_id is null then
    raise exception 'Anmeldung erforderlich';
  end if;
  if cleaned_nickname !~ '^[A-Za-z0-9_.-]{2,16}$' then
    raise exception 'Spitzname muss 2 bis 16 erlaubte Zeichen enthalten';
  end if;

  insert into public.profiles (id, nickname)
  values (current_user_id, cleaned_nickname)
  on conflict (id) do update
    set nickname = excluded.nickname, updated_at = now();
end;
$$;

create or replace function public.record_game(
  p_game_id uuid,
  p_solved boolean,
  p_attempts integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Anmeldung erforderlich';
  end if;
  if p_game_id is null or p_solved is null or p_attempts is null
     or p_attempts < 1 or p_attempts > 6
     or (not p_solved and p_attempts <> 6) then
    raise exception 'Ungültiges Spielergebnis';
  end if;
  if not exists (select 1 from public.profiles where id = current_user_id) then
    raise exception 'Bitte zuerst einen Spitznamen speichern';
  end if;

  insert into public.games (player_id, game_id, solved, attempts)
  values (current_user_id, p_game_id, p_solved, p_attempts)
  on conflict (player_id, game_id) do nothing;
  return true;
end;
$$;

create or replace function public.get_my_profile()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'nickname', p.nickname,
    'games_played', count(g.game_id)::integer,
    'solved_words', (count(g.game_id) filter (where g.solved))::integer,
    'attempts_used', coalesce(sum(g.attempts), 0)::integer,
    'points', coalesce(sum(
      case when g.solved then 100 + (6 - g.attempts) * 10 else 0 end
    ), 0)::integer
  )
  from public.profiles p
  left join public.games g on g.player_id = p.id
  where p.id = auth.uid()
  group by p.id;
$$;

create or replace function public.leaderboard_data()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with stats as (
    select
      p.nickname,
      count(g.game_id)::integer as games_played,
      (count(g.game_id) filter (where g.solved))::integer as solved_words,
      coalesce(sum(g.attempts), 0)::integer as attempts_used,
      coalesce(sum(g.attempts) filter (where g.solved), 0)::integer as solved_attempts
    from public.profiles p
    left join public.games g on g.player_id = p.id
    group by p.id, p.nickname
  )
  select jsonb_build_object(
    'fewest', coalesce((
      select jsonb_agg(to_jsonb(r))
      from (
        select nickname, solved_words,
          round(solved_attempts::numeric / nullif(solved_words, 0), 2) as average_attempts
        from stats
        where solved_words > 0
        order by average_attempts, solved_words desc, nickname
        limit 10
      ) r
    ), '[]'::jsonb),
    'most', coalesce((
      select jsonb_agg(to_jsonb(r))
      from (
        select nickname, solved_words
        from stats
        where solved_words > 0
        order by solved_words desc, nickname
        limit 10
      ) r
    ), '[]'::jsonb),
    'kd', coalesce((
      select jsonb_agg(to_jsonb(r))
      from (
        select nickname, solved_words,
          round(solved_words::numeric / nullif(attempts_used, 0), 2) as kd_ratio
        from stats
        where solved_words > 0
        order by kd_ratio desc, solved_words desc, nickname
        limit 10
      ) r
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.set_nickname(text) from public, anon;
revoke all on function public.record_game(uuid, boolean, integer) from public, anon;
revoke all on function public.get_my_profile() from public, anon;
revoke all on function public.leaderboard_data() from public;
grant execute on function public.set_nickname(text) to authenticated;
grant execute on function public.record_game(uuid, boolean, integer) to authenticated;
grant execute on function public.get_my_profile() to authenticated;
grant execute on function public.leaderboard_data() to anon, authenticated;
