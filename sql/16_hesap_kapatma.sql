-- =====================================================================
-- 16: Hesap kapatma — soft-delete + geri bildirim
-- =====================================================================
-- Akış:
--   1) Kullanıcı "Hesabımı Kapat" der → ilanları silinir, geri bildirim
--      tablosuna yazılır, profiles.silinmek_uzere_at = now() set edilir.
--   2) 7 gün içinde tekrar login olursa → "Vazgeç" butonu ile
--      silinmek_uzere_at = NULL (hesap geri açılır).
--   3) 7 gün dolarsa → pg_cron job profiles satırını siler
--      (auth.users CASCADE ile birlikte düşer).
-- =====================================================================

-- 1) Soft-delete kolonu
alter table public.profiles
  add column if not exists silinmek_uzere_at timestamptz;

create index if not exists profiles_silinmek_uzere_at_idx
  on public.profiles (silinmek_uzere_at)
  where silinmek_uzere_at is not null;

-- 2) Geri bildirim tablosu (kullanıcı silindikten sonra da kalsın diye user_id nullable + on delete set null)
create table if not exists public.hesap_kapatma_geri_bildirim (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete set null,
  sebep        text,   -- chip key (bulamadim / az_ilan / teknik / baska_uygulama / diger)
  aciklama     text,   -- opsiyonel serbest metin
  email_snapshot text, -- kullanıcı silindikten sonra hangi e-postaymış (audit)
  created_at   timestamptz not null default now()
);

alter table public.hesap_kapatma_geri_bildirim enable row level security;

-- INSERT: kullanıcı kendi geri bildirimini ekler
drop policy if exists "kapatma_gb_insert_own" on public.hesap_kapatma_geri_bildirim;
create policy "kapatma_gb_insert_own"
  on public.hesap_kapatma_geri_bildirim
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- SELECT: sadece admin
drop policy if exists "kapatma_gb_select_admin" on public.hesap_kapatma_geri_bildirim;
create policy "kapatma_gb_select_admin"
  on public.hesap_kapatma_geri_bildirim
  for select
  to authenticated
  using (is_admin());

-- 3) Kullanıcı silinmek_uzere_at alanını kendi PATCH'liyebilmeli
--    (RLS update policy zaten auth.uid()=id ile var olmalı; sadece teyit)
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='profiles'
      and policyname='profiles_update_own'
  ) then
    create policy profiles_update_own on public.profiles
      for update to authenticated
      using (auth.uid() = id)
      with check (auth.uid() = id);
  end if;
end $$;

-- 4) 7 gün+ önce silinmek üzere işaretlenen hesapları temizleyen fonksiyon
create or replace function public.cleanup_silinmek_uzere_hesaplar()
returns int
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  silinen int := 0;
  rec record;
begin
  for rec in
    select id from public.profiles
    where silinmek_uzere_at is not null
      and silinmek_uzere_at < now() - interval '7 days'
  loop
    -- auth.users CASCADE → profiles + ilanlar + yorumlar düşer
    delete from auth.users where id = rec.id;
    silinen := silinen + 1;
  end loop;
  return silinen;
end;
$$;

-- 5) pg_cron — günlük 03:30 UTC (mevcut cleanup_expired_ilanlar 03:00 ile çakışmasın)
--    pg_cron extension Supabase'de "Database → Extensions" altından aktif edilmiş olmalı.
do $$ begin
  if exists (select 1 from pg_extension where extname='pg_cron') then
    perform cron.unschedule('cleanup-silinmek-uzere')
      where exists (select 1 from cron.job where jobname='cleanup-silinmek-uzere');
    perform cron.schedule(
      'cleanup-silinmek-uzere',
      '30 3 * * *',
      $cron$ select public.cleanup_silinmek_uzere_hesaplar(); $cron$
    );
  end if;
end $$;

-- =====================================================================
-- KONTROL:
--   select * from public.profiles where silinmek_uzere_at is not null;
--   select * from public.hesap_kapatma_geri_bildirim order by created_at desc;
--   select public.cleanup_silinmek_uzere_hesaplar();  -- manuel tetikleme
-- =====================================================================
