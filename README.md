# izincikurye.com

Ankara için basit, kullanışlı **izinci kurye** ilan platformu.

## Özellikler

- İzinci kurye ilanları (anasayfa)
- İlçeye göre filtreleme + "Tümü" seçeneği
- Üyelik (Supabase Auth — e-posta doğrulama, şifre sıfırlama)
- Ölçek tabanlı ilan formu: çalışma saati (4–16), günlük ücret (200–300 ₺), KM ücreti (5–10 ₺)
- İletişim bilgileri sadece kayıtlı kullanıcılara açık
- Ara / WhatsApp / Adres butonları
- Sahibi ilanını admin onayı olmadan kaldırabilir

## Stack

- HTML + CSS + Vanilla JS (henüz framework yok)
- [Supabase](https://supabase.com) (Postgres + Auth + RLS)

## Yerel çalıştırma

```bash
npx http-server -p 8000 -c-1
```

Tarayıcı: http://localhost:8000

## Klasör yapısı

```
izincikurye/
├── index.html
├── style.css
├── script.js
├── supabase-config.js   # Supabase URL + publishable key
└── README.md
```
