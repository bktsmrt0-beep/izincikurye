-- ============================================================
-- izincikurye — Yeni ilan → Edge Function webhook trigger
-- ÖN GEREKLİLİK: notify-new-ilan edge function deploy edilmiş olmalı.
-- ============================================================

-- pg_net extension'ı (Supabase'de varsa aktif et — yoksa Dashboard > Extensions)
create extension if not exists pg_net;

-- ============================================================
-- 1) Edge Function URL'ini bir yerde sakla
--    (Dashboard > Settings > API > Project URL'i baz al)
--    Manuel olarak değiştir:
-- ============================================================
-- ÖRNEK:  https://<your-project-ref>.functions.supabase.co/notify-new-ilan
--   - <your-project-ref> kısmını kendi proje ref'inle değiştir.

-- ============================================================
-- 2) Trigger fonksiyonu — yeni ilan insert sonrası webhook çağırır
-- ============================================================
create or replace function notify_new_ilan_webhook()
returns trigger
language plpgsql
security definer
as $$
declare
  edge_url text := 'https://YOUR_PROJECT_REF.functions.supabase.co/notify-new-ilan';
  service_role_key text := 'YOUR_SERVICE_ROLE_KEY'; -- Dashboard > Settings > API > service_role
  payload jsonb;
begin
  payload := jsonb_build_object(
    'type', 'INSERT',
    'table', 'ilanlar',
    'schema', 'public',
    'record', row_to_json(new)
  );

  -- Async HTTP çağrısı (pg_net) — INSERT'i bloklamaz
  perform net.http_post(
    url := edge_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := payload,
    timeout_milliseconds := 5000
  );

  return new;
end;
$$;

-- ============================================================
-- 3) Trigger'ı ilanlar tablosuna bağla
-- ============================================================
drop trigger if exists notify_new_ilan_trigger on ilanlar;
create trigger notify_new_ilan_trigger
  after insert on ilanlar
  for each row execute function notify_new_ilan_webhook();

-- Test: yeni bir ilan ekle, sonra
--   select * from net.http_request_queue order by id desc limit 5;
--   select * from net.http_response order by created desc limit 5;
