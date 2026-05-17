-- =====================================================================
-- 19: isyeri_ad / isyeri_adres iş ilanları için NULL'a izin ver (v154 fix)
-- =====================================================================
-- Anlık ilanlarda isyeri_ad ve isyeri_adres form-level zorunlu kalır,
-- iş ilanları için DB seviyesinde NOT NULL kaldırılır. sql/18'de
-- unutulduğu için yeni migration olarak ekleniyor.
-- =====================================================================

do $$ begin
  begin alter table public.ilanlar alter column isyeri_ad drop not null; exception when others then null; end;
  begin alter table public.ilanlar alter column isyeri_adres drop not null; exception when others then null; end;
end $$;

-- =====================================================================
-- KONTROL:
--   \d ilanlar  -- isyeri_ad ve isyeri_adres satırlarında "not null" olmamalı
-- =====================================================================
