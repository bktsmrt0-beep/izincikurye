-- =============================================================
-- sql/08_iletisim_tel.sql
-- İlana özel iletişim telefonu (ilan veren, başkasının
-- aranması istenirse bu sütundan farklı bir numara verebilir).
-- =============================================================

alter table public.ilanlar
  add column if not exists iletisim_tel text;

-- Mevcut ilanlar için iletisim_tel boş bırakılır; render tarafında
-- fallback profiles.tel'e düşer.

comment on column public.ilanlar.iletisim_tel is
  'İlana özel iletişim telefonu (10+ hane). Boş ise profiles.tel kullanılır.';
