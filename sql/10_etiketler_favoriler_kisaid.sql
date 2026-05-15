-- =============================================================
-- sql/10_etiketler_favoriler_kisaid.sql
-- Yeni kart tasarımı için:
--   1) ilanlar.etiketler text[]  (paket_teslimati, guvenli_odeme, anlik_ihtiyac)
--   2) ilanlar.kisa_id  (KRY-XXXX okunabilir kısa ID, sequence ile)
--   3) favoriler tablosu + RLS
--   4) sikayetler tablosu + RLS
-- Idempotent: yeniden çalıştırılabilir.
-- =============================================================

-- 1) ETİKETLER ----------------------------------------------
alter table public.ilanlar
  add column if not exists etiketler text[] default '{}'::text[];

-- 2) KISA_ID ------------------------------------------------
create sequence if not exists public.ilan_kisa_id_seq start with 1000;

alter table public.ilanlar
  add column if not exists kisa_id text;

-- benzersiz indeks
create unique index if not exists ilanlar_kisa_id_uidx
  on public.ilanlar(kisa_id);

-- trigger: insert'te kisa_id boşsa otomatik ata
create or replace function public.set_ilan_kisa_id()
returns trigger language plpgsql as $$
begin
  if new.kisa_id is null or new.kisa_id = '' then
    new.kisa_id := 'KRY-' || lpad(nextval('public.ilan_kisa_id_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_ilan_kisa_id on public.ilanlar;
create trigger trg_set_ilan_kisa_id
  before insert on public.ilanlar
  for each row execute function public.set_ilan_kisa_id();

-- Eski kayıtları backfill
update public.ilanlar
set kisa_id = 'KRY-' || lpad(nextval('public.ilan_kisa_id_seq')::text, 4, '0')
where kisa_id is null or kisa_id = '';

-- 3) FAVORİLER ----------------------------------------------
create table if not exists public.favoriler (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  ilan_id     uuid not null references public.ilanlar(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, ilan_id)
);

create index if not exists favoriler_user_idx on public.favoriler(user_id);
create index if not exists favoriler_ilan_idx on public.favoriler(ilan_id);

alter table public.favoriler enable row level security;

drop policy if exists "favoriler_select_own" on public.favoriler;
create policy "favoriler_select_own" on public.favoriler
  for select using (auth.uid() = user_id);

drop policy if exists "favoriler_insert_own" on public.favoriler;
create policy "favoriler_insert_own" on public.favoriler
  for insert with check (auth.uid() = user_id);

drop policy if exists "favoriler_delete_own" on public.favoriler;
create policy "favoriler_delete_own" on public.favoriler
  for delete using (auth.uid() = user_id);

-- 4) ŞİKAYETLER ----------------------------------------------
create table if not exists public.sikayetler (
  id          uuid primary key default gen_random_uuid(),
  ilan_id     uuid references public.ilanlar(id) on delete set null,
  user_id     uuid references auth.users(id) on delete set null,
  sebep       text not null,
  aciklama    text,
  durum       text not null default 'beklemede' check (durum in ('beklemede','incelendi','reddedildi')),
  created_at  timestamptz not null default now()
);

create index if not exists sikayetler_ilan_idx on public.sikayetler(ilan_id);
create index if not exists sikayetler_durum_idx on public.sikayetler(durum);

alter table public.sikayetler enable row level security;

-- Kullanıcı kendi şikayetlerini görür, admin hepsini görür
drop policy if exists "sikayetler_select_own_or_admin" on public.sikayetler;
create policy "sikayetler_select_own_or_admin" on public.sikayetler
  for select using (auth.uid() = user_id or is_admin());

-- Authenticated kullanıcı şikayet açar
drop policy if exists "sikayetler_insert_auth" on public.sikayetler;
create policy "sikayetler_insert_auth" on public.sikayetler
  for insert with check (auth.uid() = user_id);

-- Sadece admin günceller (durum)
drop policy if exists "sikayetler_update_admin" on public.sikayetler;
create policy "sikayetler_update_admin" on public.sikayetler
  for update using (is_admin());

-- =============================================================
-- Çalıştırdıktan sonra:
--   select id, kisa_id, baslik from ilanlar order by created_at desc limit 5;
--   -- her satırda kisa_id 'KRY-XXXX' formatında olmalı
-- =============================================================
