-- =====================================================================
-- 30: profiles SELECT policy — çekici/işletme profilleri herkesçe okunsun
-- =====================================================================
-- TEŞHİS: 2 kayıt DB'de cekici_aktif+cekici_musait=true olarak var,
-- ama kurye kullanıcı Müsait Çekiciler listesinde göremiyor.
-- Sebep: profiles SELECT policy authenticated kullanıcılara
-- yalnızca kullanici_tipi='kurye' satırlarını veya kendi satırını
-- okumaya izin veriyor olabilir.
--
-- ÇÖZÜM: profiles için public SELECT policy ekle — anon + authenticated
-- her profili okur. Müsait Kuryeler'i bozmaz (zaten görünür).
-- =====================================================================

-- Mevcut policy varsa kalsın (additive). Yeni policy duplicate olmaz.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_select_public'
  ) then
    create policy profiles_select_public
      on public.profiles
      for select
      using (true);
  end if;
end $$;

-- =====================================================================
-- KONTROL (kurye hesabı ile giriş yap, F12 Network tab):
--   GET /rest/v1/profiles?cekici_aktif=eq.true&cekici_musait=eq.true...
--   200 + 2 satır dönmeli (önceden 0 dönüyordu).
-- =====================================================================
