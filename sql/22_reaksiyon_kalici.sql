-- =====================================================================
-- 22: Reaksiyonlar kalıcılaştırılır (v164)
-- =====================================================================
-- Kullanıcı bir ilana beğeni/beğenmeme verdikten sonra GERİ ALAMAZ.
-- Manipülasyon önleme: spekülatif click yarışı, sallama oy değişikliği,
-- toggle abuse engellenir.
--
-- Mevcut: UNIQUE(user_id, ilan_id) — bir kullanıcı tek reaksiyon
-- + INSERT/UPDATE/DELETE policy (kullanıcı kendi satırı için)
--
-- Yeni: sadece INSERT (kullanıcı reaksiyon verebilir) + SELECT (görme).
-- UPDATE ve DELETE policy'leri kaldırılır → DB seviyesinde değişiklik
-- ve silme engellenir.
-- =====================================================================

drop policy if exists "reaksiyonlar_update_own" on public.reaksiyonlar;
drop policy if exists "reaksiyonlar_delete_own" on public.reaksiyonlar;

-- INSERT policy zaten var (sql/11), UNIQUE constraint duplicate INSERT'i
-- "duplicate key value violates unique constraint" hatasıyla engeller.
-- Yani bir kullanıcı aynı ilana ikinci kez reaksiyon veremez.

-- Admin için silme yetkisi (moderasyon — manipülasyon tespit edilirse):
drop policy if exists "reaksiyonlar_delete_admin" on public.reaksiyonlar;
create policy "reaksiyonlar_delete_admin" on public.reaksiyonlar
  for delete to authenticated using (public.is_admin());

-- =====================================================================
-- KONTROL:
--   select policyname, cmd from pg_policies where tablename='reaksiyonlar';
--   -- Sadece: reaksiyonlar_select_all (SELECT), reaksiyonlar_insert_own (INSERT),
--   --        reaksiyonlar_delete_admin (DELETE) görünmeli. update_own/delete_own YOK.
-- =====================================================================
