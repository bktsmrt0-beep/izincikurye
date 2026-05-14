-- 07_isletme_alanlari.sql
-- İşletme profilinin tamamlanması için yeni alan: isletme_tipi
-- Mevcut alanlar (zaten var): isletme_adi, is_adresi, is_telefonu

alter table public.profiles
  add column if not exists isletme_tipi text;

-- Yalnız izin verilen değerler (NULL = henüz seçilmedi, kurye için boş)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_isletme_tipi_check'
  ) then
    alter table public.profiles
      add constraint profiles_isletme_tipi_check
      check (isletme_tipi is null or isletme_tipi in ('restoran','market','eczane','cafe','diger'));
  end if;
end$$;

-- handle_new_user trigger'ı metadata'dan isletme_tipi alabilsin (opsiyonel — kayıt sırasında istenmiyor)
-- Mevcut handle_new_user fonksiyonu zaten profiles satırı oluşturduğu için ek değişiklik gerekmiyor.
-- Bu alan profil modalından doldurulacak.
