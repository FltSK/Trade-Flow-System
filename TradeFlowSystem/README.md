# Cari Sistem Paneli (React + MUI)

Bu proje, .NET backend ile entegre edilebilecek şekilde hazırlanmış, modern ve rol bazlı yetkilendirmeye sahip bir cari sistem paneli frontendidir.

## Özellikler
- Yönetici ve çalışan rolleri
- Giriş ekranı (admin: admin/admin123, çalışan: calisan/calisan123)
- Dashboard (özet kutular)
- Cariler (listele, ekle, düzenle, sil)
- Faturalar (sadece admin)
- Ödemeler (sadece admin)
- Material UI ile modern ve responsive tasarım
- Mock data ile çalışır, backend hazır olunca kolayca entegre edilir

## Kurulum
```sh
npm install
npm run dev
```

## Klasör Yapısı
- `src/pages` : Sayfa bileşenleri
- `src/components` : Ortak UI bileşenleri
- `src/context` : Auth context ve kullanıcı yönetimi

## Notlar
- Backend hazır olduğunda, API çağrıları kolayca entegre edilebilir.
- Sadece frontenddir, demo amaçlı mock data ile çalışır. 