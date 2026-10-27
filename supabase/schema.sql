create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  pants_size text not null default '',
  shirt_size text not null default '',
  shoe_size text not null default '',
  favorite_color text not null default '',
  interests text not null default '',
  gift_suggestion text not null default ''
);

alter table public.participants enable row level security;

drop policy if exists "leitura_publica" on public.participants;
create policy "leitura_publica"
  on public.participants
  for select
  to anon
  using (true);

drop policy if exists "atualizacao_publica" on public.participants;
create policy "atualizacao_publica"
  on public.participants
  for update
  to anon
  using (true)
  with check (true);

grant usage on schema public to anon;
grant select on public.participants to anon;
revoke insert, update, delete on public.participants from anon;
grant update (
  pants_size,
  shirt_size,
  shoe_size,
  favorite_color,
  interests,
  gift_suggestion
) on public.participants to anon;
