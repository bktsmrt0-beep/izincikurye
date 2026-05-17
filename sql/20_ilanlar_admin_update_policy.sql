-- =====================================================================
-- 20: Admin için UPDATE RLS policy (v154 fix — onay/red için)
-- =====================================================================
-- Mevcut RLS: kullanıcı kendi ilanını günceller (auth.uid()=user_id).
-- Admin başkasının ilanını UPDATE edemiyordu → onay/red sessizce başarısız
-- oluyordu (0 row affected, hata yok). Bu policy admin'e tam yetki verir.
--
-- Aynı pattern: anlık ilanlarda mevcut admin DELETE policy zaten çalışıyor;
-- sadece UPDATE eksikti.
-- =====================================================================

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='ilanlar'
      and policyname='ilanlar_update_admin'
  ) then
    create policy "ilanlar_update_admin" on public.ilanlar
      for update to authenticated
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end $$;

-- =====================================================================
-- KONTROL:
--   select * from pg_policies where tablename = 'ilanlar' order by policyname;
--   -- "ilanlar_update_admin" satırı görünmeli
-- =====================================================================
