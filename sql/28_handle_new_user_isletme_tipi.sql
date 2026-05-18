-- =====================================================================
-- 28: handle_new_user trigger'a isletme_tipi metadata okumayı ekle (v187)
-- =====================================================================
-- Kayıt formuna isletme_tipi dropdown (required) eklendi (v187).
-- Mevcut handle_new_user trigger'ı bunu metadata'dan okumuyor olabilir
-- (sql/07'de "kayıt sırasında istenmiyor" notu vardı).
--
-- Bu migration trigger'ı CREATE OR REPLACE ile yeniler — auth.users'a
-- yeni satır INSERT edildiğinde metadata'daki tüm bilinen alanları
-- profiles satırına yazar. Mevcut profile yoksa INSERT, varsa UPSERT.
--
-- ⚠ Eğer eski handle_new_user fonksiyonun bilmediğimiz ek mantığı
--   varsa (özel kolonlar, bildirim/avatar/vb), bunu görmek için
--   önce: SELECT pg_get_functiondef('public.handle_new_user'::regproc);
--   sonra burada o satırları koru.
-- =====================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kullanici_tipi text := new.raw_user_meta_data ->> 'kullanici_tipi';
  v_isletme_tipi text := new.raw_user_meta_data ->> 'isletme_tipi';
begin
  insert into public.profiles (
    id,
    ad,
    soyad,
    tel,
    ticari,
    kullanici_tipi,
    isletme_adi,
    isletme_tipi,
    is_adresi,
    is_telefonu
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'ad', ''),
    coalesce(new.raw_user_meta_data ->> 'soyad', ''),
    coalesce(new.raw_user_meta_data ->> 'tel', ''),
    coalesce((new.raw_user_meta_data ->> 'ticari')::boolean, false),
    nullif(v_kullanici_tipi, ''),
    nullif(new.raw_user_meta_data ->> 'isletme_adi', ''),
    nullif(v_isletme_tipi, ''),
    nullif(new.raw_user_meta_data ->> 'is_adresi', ''),
    nullif(new.raw_user_meta_data ->> 'is_telefonu', '')
  )
  on conflict (id) do update set
    ad = excluded.ad,
    soyad = excluded.soyad,
    tel = excluded.tel,
    ticari = excluded.ticari,
    kullanici_tipi = excluded.kullanici_tipi,
    isletme_adi = excluded.isletme_adi,
    isletme_tipi = excluded.isletme_tipi,
    is_adresi = excluded.is_adresi,
    is_telefonu = excluded.is_telefonu;

  return new;
end;
$$;

-- Trigger'ın varlığından emin ol (eskiden tanımlanmışsa zaten var)
do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'on_auth_user_created'
      and tgrelid = 'auth.users'::regclass
  ) then
    create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
  end if;
end $$;

-- =====================================================================
-- KONTROL:
--   Test kayıt aç (işletme + isletme_tipi='restoran') →
--   select isletme_tipi from public.profiles where id = '<yeni-user-id>';
--   -- 'restoran' görünmeli
-- =====================================================================
