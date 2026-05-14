-- =============================================================
-- sql/09_phone_e164.sql
-- Mevcut tüm telefon kayıtlarını E.164 (+90...) formatına çevirir.
-- Idempotent: birden fazla çalıştırılabilir.
--
-- Kapsam:
--   profiles.tel
--   profiles.is_telefonu
--   ilanlar.iletisim_tel
-- =============================================================

create or replace function _phone_to_e164(p text) returns text language plpgsql immutable as $$
declare
  d text := regexp_replace(coalesce(p, ''), '\D', '', 'g');
begin
  if d = '' then return null; end if;
  if length(d) = 10 then return '+90' || d; end if;
  if length(d) = 11 and left(d, 1) = '0' then return '+90' || substr(d, 2); end if;
  if length(d) = 12 and left(d, 2) = '90' then return '+' || d; end if;
  if length(d) = 13 and left(d, 2) = '90' then return '+' || substr(d, 1, 12); end if;
  return '+' || d;
end;
$$;

-- profiles.tel
update public.profiles
set tel = _phone_to_e164(tel)
where tel is not null
  and tel not like '+90%';

-- profiles.is_telefonu
update public.profiles
set is_telefonu = _phone_to_e164(is_telefonu)
where is_telefonu is not null
  and is_telefonu <> ''
  and is_telefonu not like '+90%';

-- ilanlar.iletisim_tel
update public.ilanlar
set iletisim_tel = _phone_to_e164(iletisim_tel)
where iletisim_tel is not null
  and iletisim_tel <> ''
  and iletisim_tel not like '+90%';

-- Helper'ı bırak (ileride yine kullanışlı)
comment on function _phone_to_e164(text) is
  'Türk telefon numarasını E.164 (+90...) formatına dönüştürür. NULL/boş için NULL döner.';
