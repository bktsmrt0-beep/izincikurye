-- ============================================================
-- izincikurye — Cleanup + Rate Limit
-- Supabase SQL Editor'da SIRAYLA ÇALIŞTIR (her bloğu ayrı çalıştırabilirsin).
-- ============================================================

-- ============================================================
-- 1) pg_cron extension'ı aktif et (Supabase Dashboard > Database > Extensions
--    bölümünden "pg_cron" enable edilmiş olmalı — yoksa önce orayı aç)
-- ============================================================
create extension if not exists pg_cron;

-- ============================================================
-- 2) Süresi dolan ilanları temizleyen fonksiyon
--    7 günden eski expired ilanları siler (analytics için grace period)
-- ============================================================
create or replace function cleanup_expired_ilanlar()
returns void
language plpgsql
security definer
as $$
begin
  delete from ilanlar
  where expires_at < now() - interval '7 days';
end;
$$;

-- ============================================================
-- 3) Cron job: her gün 03:00 UTC'de çalıştır
-- ============================================================
-- Eski job varsa kaldır (idempotent çalışması için)
select cron.unschedule('cleanup-expired-ilanlar')
  where exists (select 1 from cron.job where jobname = 'cleanup-expired-ilanlar');

select cron.schedule(
  'cleanup-expired-ilanlar',
  '0 3 * * *',
  $$ select cleanup_expired_ilanlar(); $$
);

-- ============================================================
-- 4) RATE LIMIT: 24 saat içinde max 5 ilan
--    Trigger: yeni ilan insert edilmeden önce sayar
-- ============================================================
create or replace function check_daily_ilan_limit()
returns trigger
language plpgsql
as $$
declare
  recent_count int;
  max_daily constant int := 5;
begin
  -- Admin'ler limitten muaf
  if is_admin() then
    return new;
  end if;

  select count(*) into recent_count
  from ilanlar
  where user_id = new.user_id
    and created_at > now() - interval '24 hours';

  if recent_count >= max_daily then
    raise exception 'GUNLUK_ILAN_LIMITI: Son 24 saatte % ilan verdin, limit %.', recent_count, max_daily
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists ilan_daily_limit_trigger on ilanlar;
create trigger ilan_daily_limit_trigger
  before insert on ilanlar
  for each row execute function check_daily_ilan_limit();

-- ============================================================
-- 5) (Opsiyonel) Kullanıcının son 24 saatteki ilan sayısını döner
--    Client tarafında "kalan ilan hakkı" gösterimi için
-- ============================================================
create or replace function my_daily_ilan_count()
returns int
language sql
security definer
as $$
  select count(*)::int
  from ilanlar
  where user_id = auth.uid()
    and created_at > now() - interval '24 hours';
$$;

-- Test: select * from cron.job;
-- Test: select my_daily_ilan_count();
