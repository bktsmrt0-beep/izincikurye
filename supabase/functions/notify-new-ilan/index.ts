// Supabase Edge Function — yeni ilan açıldığında tercih ilçesi eşleşen kuryelere email gönderir
//
// KURULUM (sen yapacaksın):
//   1) npm i -g supabase  (henüz kurmadıysan)
//   2) supabase login
//   3) Resend hesabı aç (resend.com) — free tier 100 email/gün
//   4) supabase secrets set RESEND_API_KEY=re_xxx
//   5) supabase secrets set NOTIFY_FROM='izincikurye <bildirim@izincikurye.com>'
//      (kendi doğrulanmış domain'inle. Hızlı test için: 'onboarding@resend.dev')
//   6) supabase functions deploy notify-new-ilan --no-verify-jwt
//   7) Veritabanı trigger'ı: sql/04_notify_trigger.sql dosyasını Supabase SQL Editor'da çalıştır

// @ts-nocheck — Deno runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const NOTIFY_FROM = Deno.env.get("NOTIFY_FROM") || "onboarding@resend.dev";

const sb = createClient(SUPABASE_URL, SERVICE_ROLE);

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    // pg_net webhook payload: { type, table, record, schema, old_record }
    const ilan = payload.record;
    if (!ilan?.id || !ilan?.ilce) {
      return new Response("Invalid payload", { status: 400 });
    }

    // Bu ilçeyi tercih eden + bildirimi açık + ilan sahibi olmayan kuryeleri bul
    const { data: targets, error } = await sb
      .from("profiles")
      .select("id, ad, bildirimler, tercih_ilceler")
      .eq("kullanici_tipi", "kurye")
      .contains("tercih_ilceler", [ilan.ilce])
      .neq("id", ilan.user_id);

    if (error) {
      console.error("query profiles", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    // Email'i auth.users'tan çekmek için kullanıcı id listesi
    const wantsEmail = (targets || []).filter(p => p.bildirimler?.yeni_ilan !== false);
    if (wantsEmail.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: "no_targets" }));
    }

    const { data: users } = await sb.auth.admin.listUsers({
      page: 1, perPage: 1000
    });
    const emailMap = new Map((users?.users || []).map(u => [u.id, u.email]));

    const url = `https://izincikurye.vercel.app/?ilan=${ilan.id}`;
    let sent = 0;

    for (const p of wantsEmail) {
      const to = emailMap.get(p.id);
      if (!to) continue;
      const subject = `Yeni izinci ilanı: ${ilan.ilce} · ${ilan.fiyat}₺`;
      const html = `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px">
          <h2 style="color:#ff7a00;margin:0 0 12px">Yeni İlan: ${ilan.baslik}</h2>
          <p style="color:#374151;line-height:1.5">
            <strong>📍 ${ilan.ilce}</strong> · ⏱ ${ilan.saat} saat (${ilan.bas_saat}–${ilan.bit_saat})<br>
            💰 <strong>${ilan.fiyat} ₺</strong> · ${ilan.km} ₺/km
          </p>
          ${ilan.aciklama ? `<p style="color:#6b7280">${ilan.aciklama}</p>` : ""}
          <p style="margin-top:20px">
            <a href="${url}" style="display:inline-block;background:#ff7a00;color:white;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600">İlanı Gör</a>
          </p>
          <p style="color:#9ca3af;font-size:12px;margin-top:32px">
            Bu e-postayı <strong>${ilan.ilce}</strong> tercih ettiğin için aldın.
            Profilinden bildirimleri kapatabilirsin.
          </p>
        </div>
      `;

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ from: NOTIFY_FROM, to, subject, html })
      });
      if (res.ok) sent++;
      else console.warn("resend fail", await res.text());
    }

    return new Response(JSON.stringify({ sent, total: wantsEmail.length }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
