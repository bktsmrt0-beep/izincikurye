-- ============================================================
-- izincikurye — Telefon eşleştirme düzeltmesi
-- Sorun: SQL fonksiyonu tüm rakamları aynen karşılaştırıyordu.
--   "5302166532" (10 hane) != "05302166532" (11 hane, baştaki 0 ile kayıtlı)
-- Çözüm: SON 10 HANE karşılaştır — ülke kodu / 0 prefix farklarını yok say.
-- ============================================================

create or replace function grant_review_and_delete_ilan(
  p_ilan_id uuid,
  p_kurye_tel text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_ilan ilanlar%rowtype;
  v_kurye_id uuid;
  v_last10 text;
begin
  -- İlanı çek + sahiplik kontrolü
  select * into v_ilan from ilanlar where id = p_ilan_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'ilan_bulunamadi');
  end if;
  if v_ilan.user_id <> auth.uid() then
    return jsonb_build_object('ok', false, 'reason', 'yetkisiz');
  end if;

  -- Telefonun SON 10 hanesi (ülke kodu / baştaki 0 farkını yok say)
  v_last10 := right(regexp_replace(coalesce(p_kurye_tel, ''), '\D', '', 'g'), 10);

  if length(v_last10) = 10 then
    select id into v_kurye_id
    from profiles
    where kullanici_tipi = 'kurye'
      and right(regexp_replace(coalesce(tel,''), '\D', '', 'g'), 10) = v_last10
    limit 1;
  end if;

  -- Eslesme varsa yorum hakkı ver
  if v_kurye_id is not null and v_kurye_id <> auth.uid() then
    insert into yorum_haklari (kurye_id, isletme_id, ilan_id, ilan_baslik)
    values (v_kurye_id, auth.uid(), v_ilan.id, v_ilan.baslik)
    on conflict (kurye_id, isletme_id, ilan_id) do nothing;
  end if;

  -- İlanı sil
  delete from ilanlar where id = p_ilan_id;

  return jsonb_build_object(
    'ok', true,
    'matched', v_kurye_id is not null,
    'kurye_id', v_kurye_id
  );
end;
$$;

-- Test:
--   select grant_review_and_delete_ilan('<ilan_uuid>', '5302166532');
--   select grant_review_and_delete_ilan('<ilan_uuid>', '05302166532');
--   select grant_review_and_delete_ilan('<ilan_uuid>', '+905302166532');
-- Hepsi aynı kuryeyi eşleştirmeli.
