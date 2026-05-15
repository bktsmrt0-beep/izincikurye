-- =============================================================
-- sql/14_reaksiyon_rate_limit.sql
-- Spam koruma: kullanıcı 60 saniyede max 10 reaksiyon yapabilir
--
-- Niye?
--   - Aynı kullanıcı aynı ilana zaten 1 reaksiyon yapabiliyor (UNIQUE constraint, sql/11)
--   - Ama kötü niyetli kullanıcı farklı ilanlara hızlı 👎 yağdırabilir
--   - Bu trigger insert öncesi son 60sn'deki reaksiyon sayısını kontrol eder
--   - 10'u geçerse RAISE EXCEPTION ile reddeder
--
-- DELETE (toggle off) korunmaz — istediği kadar geri alabilir
-- Trigger sadece INSERT'i kapsar
-- Idempotent: yeniden çalıştırılabilir
-- =============================================================

create or replace function public.check_reaksiyon_rate_limit()
returns trigger language plpgsql as $$
declare
  recent_count int;
begin
  -- Son 60 saniyede bu kullanıcının yaptığı insert sayısı
  select count(*) into recent_count
  from public.reaksiyonlar
  where user_id = new.user_id
    and created_at > (now() - interval '60 seconds');

  if recent_count >= 10 then
    raise exception 'REAKSIYON_HIZ_LIMITI: Çok hızlı reaksiyon yapıyorsun. 1 dakika bekle.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_reaksiyon_rate_limit on public.reaksiyonlar;
create trigger trg_reaksiyon_rate_limit
  before insert on public.reaksiyonlar
  for each row execute function public.check_reaksiyon_rate_limit();

comment on function public.check_reaksiyon_rate_limit() is
  'Spam koruma: kullanıcı 60sn içinde 10 reaksiyondan fazlasını yapamaz. Hata kodu P0001.';

-- =============================================================
-- Test:
--   -- Bu sorgu 60 sn içinde 11+ reaksiyon olan kullanıcıyı bulur
--   select user_id, count(*) as rxn_per_min
--   from reaksiyonlar
--   where created_at > now() - interval '60 seconds'
--   group by user_id
--   having count(*) >= 10;
-- =============================================================
