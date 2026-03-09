# Trade Flow System

İşletmeler için müşteri (cari), stok, sipariş ve ödeme yönetimini tek panelde toplayan full-stack bir **ticari akış ve cari hesap yönetim sistemi**.

---

## Özellikler

- **Cari yönetimi** — Müşteri ekleme, düzenleme, silme, ödeme geçmişi, sözleşme ve randevu takibi
- **Ödemeler** — Nakit, kredi kartı, havale, çek/senet; ödeme taahhüt tarihi takibi
- **Siparişler** — Sipariş oluşturma, stok rezervasyonu, sipariş–müşteri ilişkisi
- **Stok yönetimi** — Stok giriş/çıkış, stok hareketleri, tedarikçi (supplier) yönetimi
- **Ürün kataloğu** — Marka, model, ürün tipi yönetimi
- **İş ve usta atamaları** — İş tanımları, usta atamaları, müşteri–usta eşleştirmesi
- **Dükkan carisi** — Günlük cari işlem kaydı
- **Dashboard** — Özet istatistikler ve hızlı erişim
- **İşlem geçmişi** — Ödeme ve cari hareket geçmişi
- **Rol tabanlı erişim** — Admin ve çalışan rolleri, JWT ile kimlik doğrulama
- **Gerçek zamanlı bildirimler** — SignalR ile anlık bildirimler
- **PDF / sözleşme** — QuestPDF ile belge üretimi
- **Oturum yönetimi** — Çoklu oturum, şifre değiştirme, e-posta güncelleme

---

## Teknolojiler

### Backend (TradeFlowSystemAPI)
| Teknoloji | Kullanım |
|-----------|----------|
| **.NET 9** | Web API, ASP.NET Core |
| **Entity Framework Core 9** | ORM, migrations |
| **PostgreSQL** | Veritabanı (Npgsql) |
| **JWT Bearer** | Kimlik doğrulama |
| **BCrypt.Net** | Şifre hashleme |
| **SignalR** | Gerçek zamanlı bildirimler (NotificationHub) |
| **QuestPDF** | PDF / sözleşme oluşturma |
| **Swagger / OpenAPI** | API dokümantasyonu |

### Frontend (TradeFlowSystem)
| Teknoloji | Kullanım |
|-----------|----------|
| **React 19** | UI bileşenleri |
| **Vite 7** | Derleme ve dev sunucusu |
| **Material UI (MUI) 7** | Tema, bileşenler, ikonlar |
| **React Router 7** | Sayfa yönlendirme |
| **Axios** | HTTP istekleri, API client |
| **SignalR (@microsoft/signalr)** | Gerçek zamanlı bağlantı |
| **date-fns** | Tarih işlemleri |
| **@mui/x-date-pickers** | Tarih seçiciler |

---

## Proje yapısı

```
Trade-Flow-System/
├── TradeFlowSystemAPI/     # .NET 9 Web API
│   ├── Controllers/        # Auth, Customers, Payments, Orders, Stok, vb.
│   ├── Models/             # Entity modelleri
│   ├── DTOs/               # Data transfer objects
│   ├── Services/           # JWT, Session, Email, Stok, Order, vb.
│   ├── Data/               # DbContext
│   ├── Hubs/               # SignalR NotificationHub
│   ├── Migrations/         # EF Core migrations
│   └── Middleware/         # Hata yönetimi
│
└── TradeFlowSystem/        # React + Vite SPA
    ├── src/
    │   ├── pages/          # Dashboard, Client, Orders, Stok, Admin, vb.
    │   ├── components/    # Layout, Navbar, Sidebar, dialoglar
    │   ├── context/       # Auth, RealTime (SignalR)
    │   ├── hooks/         # useCustomers, useDebounce
    │   └── utils/         # API helpers, formatlama
    └── public/
```

---

## Kurulum ve çalıştırma

### Gereksinimler
- .NET 9 SDK
- Node.js 18+ ve npm
- PostgreSQL

### 1. Backend
```bash
cd TradeFlowSystemAPI
```
Veritabanı ve JWT ayarlarını **User Secrets** veya `appsettings.Development.json` ile verin (bu dosya `.gitignore`'da):
```bash
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "<veritabanı-bağlantı-dizesi>"
dotnet user-secrets set "Jwt:Key" "<en-az-32-karakterlik-gizli-anahtar>"
```
Çalıştırma:
```bash
dotnet run
```
API varsayılan olarak `http://localhost:5000` üzerinde çalışır.

### 2. Frontend
```bash
cd TradeFlowSystem
npm install
npm run dev
```
Geliştirme ortamında API adresi varsayılan olarak `http://localhost:5000/api` kabul edilir. Production build için `.env` içinde `VITE_API_URL` tanımlayın (örnek: `https://api.your-domain.com/api`).

### 3. Veritabanı
```bash
cd TradeFlowSystemAPI
dotnet ef database update
```
İlk kurulumda migration'lardaki varsayılan kullanıcılar oluşturulur; **canlı ortamda mutlaka varsayılan şifreleri değiştirin.**

---

## Lisans

MIT License — detaylar için [LICENSE](LICENSE) dosyasına bakın.
