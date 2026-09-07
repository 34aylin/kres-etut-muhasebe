# Kreş & Etüt Merkezi Muhasebe Uygulaması — Proje Planı

**Hazırlayan:** Marta Teknoloji
**Tarih:** 07.09.2026
**Durum:** Taslak — geliştirmeye başlamadan önce gözden geçirilecek

## 1. Proje Özeti

Bu doküman, kreş ve etüt merkezleri için gelir/gider, veli/öğrenci ve temel muhasebe hesaplarını yönetecek web tabanlı bir uygulamanın planını içerir. Uygulama kendi Docker ortamında (self-hosted) çalışacak, çoklu şube/kurum (multi-tenant) yapısını destekleyecek şekilde tasarlanacaktır.

Görüşmede netleşen kapsam kararları:

- **Çoklu şube / multi-tenant:** Uygulama birden fazla kreş/etüt merkezi şubesini tek kurulumdan, verileri birbirinden izole şekilde yönetebilecek.
- **Ödeme/tahsilat:** İlk fazda yalnızca manuel kayıt (nakit/havale/kart tahsilatları elle girilecek). Online ödeme entegrasyonu (iyzico, PayTR vb.) kapsam dışı, ileride eklenebilecek bir faz olarak planda yer alıyor.
- **E-fatura/e-arşiv:** Kapsam dışı. Uygulama yalnızca iç gelir-gider ve hesap takibi yapacak; resmi fatura süreçleri muhasebeci/başka bir sistemde kalacak.
- **Kimlik doğrulama ve roller:** Basit rol bazlı yapı — Yönetici, Muhasebe, Öğretmen/Personel rolleri, email+şifre ile giriş. Veli portalı bu fazda yok (gelecekte eklenebilir, bkz. Faz 7).

## 2. Teknoloji Yığını

| Katman            | Teknoloji                                                        |
| ----------------- | ---------------------------------------------------------------- |
| Frontend          | Next.js (App Router) + TypeScript, Tailwind CSS, shadcn/ui       |
| Backend           | Next.js Route Handlers / Server Actions (aynı monorepo içinde)   |
| Veritabanı        | PostgreSQL                                                       |
| ORM / Migration   | Prisma (Prisma Migrate)                                          |
| Kimlik Doğrulama  | Auth.js (NextAuth) — Credentials provider + Prisma adapter       |
| Doğrulama         | Zod (form ve API şema doğrulama)                                 |
| Form Yönetimi     | React Hook Form                                                  |
| Grafik/Rapor      | Recharts veya Tremor                                             |
| Konteynerleştirme | Docker + Docker Compose (app, postgres, opsiyonel reverse proxy) |
| Test              | Vitest/Jest (unit), Playwright (e2e)                             |

## 3. Ajan (Agent) Mimarisi

Geliştirme, bir **Operatör** tarafından yönetilen dört uzman alt ajan ile yürütülecek. Operatör iş bölümünü yapar, fazlar arası geçiş kriterlerini kontrol eder ve entegrasyonu sağlar.

### 3.1 Operatör (Orchestrator)

- Fazları ve görevleri alt ajanlara dağıtır, bağımlılıkları yönetir (örn. Frontend, Database Agent'ın şema teslimini bekler).
- Her fazın sonunda "faz kapanış kriterleri"nin karşılandığını doğrular (aşağıda faz bazlı listelenmiştir).
- Alt ajanlar arası çakışmaları (örn. API sözleşmesi değişiklikleri) çözer.
- Security Agent'ın onayı olmadan bir fazı "tamamlandı" olarak işaretlemez.
- Genel ilerlemeyi ve açık riskleri raporlar.

### 3.2 Database Agent

- Prisma şema tasarımı ve migration'ların yazılması.
- Multi-tenant izolasyon stratejisinin uygulanması (tenant/şube bazlı filtreleme).
- Indexleme, performans, seed verisi (demo/test verisi) hazırlığı.
- Yedekleme/geri yükleme (backup/restore) stratejisinin tanımlanması.

### 3.3 Backend Agent

- Server actions / API route'ların yazılması (veli, öğrenci, gelir, gider, hesap planı, raporlama uç noktaları).
- İş kuralları: tahsilat/borç hesaplama, hesap planı bakiye güncelleme, raporlama agregasyonları.
- Zod ile giriş/çıkış doğrulama şemaları.
- Auth.js entegrasyonunun backend tarafı (oturum, rol kontrolü middleware'leri).

### 3.4 Frontend Agent

- Next.js App Router sayfaları, shadcn/ui bileşenleri ile arayüzler.
- Formlar (React Hook Form + Zod), tablolar (arama/filtre/sayfalama), dashboard ve raporlama görselleri.
- Rol bazlı arayüz görünürlüğü (örn. Muhasebe rolü olmayan kullanıcıya hesap planı ekranının gizlenmesi).

### 3.5 Security Agent

- RBAC (rol bazlı yetkilendirme) kurallarının uçtan uca doğrulanması.
- Tenant izolasyonunun (bir şubenin verisinin başka şubeye sızmaması) test edilmesi.
- Girdi doğrulama, rate limiting, brute-force koruması, audit log tasarımı.
- Secrets/ortam değişkeni yönetimi, bağımlılık güvenlik taraması (npm audit, Dependabot vb.).
- Her faz sonunda güvenlik onayı (sign-off) verir; kritik bulgular varsa fazı bloke eder.

### 3.6 Çalışma Akışı

1. Operatör, fazın gereksinimlerini alt ajanlara dağıtır (öncelik: Database → Backend → Frontend, Security paralel izler).
2. Database Agent şemayı/migration'ı teslim eder → Backend Agent üzerine iş mantığını kurar → Frontend Agent arayüzü bağlar.
3. Security Agent, geliştirme süresince paralel olarak inceleme yapar; faz sonunda kapsamlı kontrol listesini uygular.
4. Operatör, tüm ajanların çıktısını birleştirir, faz kapanış kriterlerini kontrol eder ve bir sonraki faza geçiş kararı verir.

## 4. Veri Modeli (Taslak Prisma Varlıkları)

- **Tenant / Branch** — Kurum/şube kaydı (multi-tenant kök varlık).
- **User** — Sistem kullanıcıları (Yönetici, Muhasebe, Öğretmen/Personel), her biri bir Tenant'a bağlı.
- **Role / Permission** — Rol tanımları ve yetkiler.
- **Parent** — Veli bilgileri (ad, iletişim, kimlik no vb.), bir Tenant'a bağlı.
- **Student** — Öğrenci bilgileri, bir veya birden fazla Parent ile ilişki (kardeş desteği), Tenant'a bağlı.
- **Enrollment** — Öğrencinin hangi programa (kreş/etüt), hangi tarihte kaydolduğu, durumu (aktif/pasif/mezun).
- **Account (Hesap Planı)** — Basit hesap planı: tip (Kasa, Banka, Gelir, Gider, Alacak, Borç), üst hesap ilişkisi.
- **Transaction** — Gelir/gider hareketleri: tutar, tarih, ilişkili Account, ilişkili Student/Parent (opsiyonel), açıklama, ödeme yöntemi (nakit/havale/kart — manuel girilir).
- **Category** — Gelir/gider alt kategorileri (Aidat, Kayıt Ücreti, Etüt/Kurs Geliri, Personel Maaşı, Kira, Fatura, Kırtasiye vb.).
- **AuditLog** — Kritik işlemlerin (kayıt oluşturma/silme, tutar değişikliği, rol değişikliği) izlenebilirliği.

### 4.1 Örnek Basit Hesap Planı

**Gelir Hesapları:** Aidat Geliri, Kayıt Ücreti Geliri, Etüt/Kurs Geliri, Servis Geliri, Yemek Geliri, Diğer Gelirler

**Gider Hesapları:** Personel Maaş Gideri, Kira Gideri, Elektrik/Su/Doğalgaz/İnternet Gideri, Kırtasiye/Malzeme Gideri, Bakım-Onarım Gideri, Vergi/SGK Gideri, Diğer Giderler

**Nakit/Banka Hesapları:** Kasa, Banka Hesabı (birden fazla banka hesabı desteklenebilir)

## 5. Fazlara Bölünmüş Yol Haritası

### Faz 0 — Proje Kurulumu ve Mimari Temeller

- Next.js + TypeScript + Tailwind + shadcn/ui proje iskeletinin kurulması.
- Docker Compose iskeleti (app + postgres) ve ortam değişkeni şablonu (.env.example).
- Prisma kurulumu, boş şema ile ilk bağlantı testi.
- Lint/format/test altyapısı (ESLint, Prettier, Vitest).
- Ajan/Operatör iş akışının ve faz kapanış kriterlerinin ekipçe onaylanması.

**Kapanış kriteri:** `docker compose up` ile boş bir Next.js uygulaması ve PostgreSQL birlikte ayağa kalkıyor.

### Faz 1 — Veri Modeli ve Kimlik Doğrulama

- Tenant/Branch, User, Role, Parent, Student çekirdek Prisma modelleri ve ilk migration.
- Multi-tenant izolasyon stratejisinin belirlenmesi (tenant_id + Prisma middleware/query filtreleme; ileride Postgres RLS değerlendirilebilir).
- Auth.js (Credentials provider) entegrasyonu, email+şifre ile giriş, rol bazlı route koruması (middleware).
- Seed script ile demo tenant, demo kullanıcı ve roller.

**Kapanış kriteri:** Farklı rollerle giriş yapılabiliyor; bir tenant'ın kullanıcısı başka tenant'ın verisine API üzerinden erişemiyor (Security Agent doğrular).

### Faz 2 — Veli ve Öğrenci Yönetimi

- Şube, Veli, Öğrenci, Kayıt (Enrollment) CRUD ekranları.
- Kardeş/çoklu veli-öğrenci ilişkisi desteği.
- Öğrenci durumu yönetimi (aktif/pasif/mezun), arama/filtre/sayfalama.

**Kapanış kriteri:** Bir şube için uçtan uca veli-öğrenci kaydı oluşturulup listelenebiliyor; roller arası görünürlük doğru çalışıyor.

### Faz 3 — Temel Muhasebe Hesap Planı ve Gelir/Gider Modülü

- Hesap planı (Account) ve kategori (Category) modellerinin uygulanması, varsayılan hesap planı seed'i.
- Gelir kaydı ekranları (aidat, kayıt ücreti, etüt geliri vb.), gidere bağlı kayıtlar (personel, kira, fatura vb.).
- Veli bazlı tahsilat/borç takibi (kim ne kadar ödedi, ne kadar borcu var).
- Kasa/Banka hesap hareketlerinin işlenmesi.

**Kapanış kriteri:** Bir gelir ve bir gider kaydı uçtan uca girilip ilgili hesap bakiyelerine yansıyor; veli borç durumu doğru hesaplanıyor.

### Faz 4 — Raporlama ve Dashboard

- Aylık/yıllık gelir-gider özet raporları, şube bazlı kırılım.
- Veli borç/alacak listesi, kasa/banka bakiye raporu.
- Basit kâr-zarar görünümü, CSV/Excel export.
- Yönetici dashboard'u (özet kartlar + grafikler).

**Kapanış kriteri:** Yönetici, seçtiği tarih aralığı ve şube için gelir-gider özetini ve veli borç listesini görüntüleyip dışa aktarabiliyor.

### Faz 5 — Güvenlik Sertleştirme ve Test

- RBAC ve tenant izolasyonu için kapsamlı test senaryoları (Security Agent liderliğinde).
- Rate limiting, brute-force koruması, girdi doğrulama şemalarının gözden geçirilmesi.
- Audit log ekranı/raporu, kritik işlemlerin izlenebilirliği.
- Bağımlılık güvenlik taraması, secrets yönetimi kontrolü.
- Unit ve e2e test kapsamının tamamlanması (kritik akışlar: giriş, gelir/gider kaydı, raporlama).

**Kapanış kriteri:** Security Agent'ın kontrol listesindeki tüm maddeler onaylı; kritik/yüksek risk bulgusu kalmıyor.

### Faz 6 — Docker Paketleme ve Deployment

- Production Dockerfile (multi-stage build), production docker-compose.yml.
- Container başlangıcında otomatik `prisma migrate deploy` çalıştırılması.
- Healthcheck, log yönetimi, yedekleme stratejisi (örn. cron ile `pg_dump`).
- Kurulum ve çalıştırma dokümantasyonu (README).

**Kapanış kriteri:** Uygulama tek komutla (`docker compose up -d`) temiz bir ortamda ayağa kalkıyor, migration'lar otomatik uygulanıyor, yedekleme çalışıyor.

### Faz 7 — Opsiyonel / Gelecek Genişletmeler

Bu faz kapsam dışıdır, ancak mimari bu eklentilere kapalı olmayacak şekilde tasarlanacaktır:

- Online ödeme entegrasyonu (iyzico, PayTR vb.) ile otomatik tahsilat.
- E-fatura/e-arşiv entegrasyonu (Logo, Paraşüt, Foriba gibi GİB entegratörleri).
- Veli portalı (velilerin kendi öğrencilerinin ödeme/borç durumunu görebilmesi).
- Email/SMS bildirim sistemi (ödeme hatırlatmaları vb.).
- Mobil uyumlu PWA desteği.

## 6. Açık Noktalar / Karar Bekleyenler

- Multi-tenant izolasyonu için uygulama-seviyesi filtreleme mi yoksa Postgres Row-Level Security mi tercih edilecek — Faz 1'de Database Agent ve Security Agent birlikte karar verecek.
- Taksitli ödeme/aidat planlaması (örn. 10 taksitli yıllık aidat) gerekiyor mu — Faz 3 kapsamını etkiler, netleşmesi gerekiyor.
- Yedekleme sıklığı ve saklama süresi politikası netleştirilmeli (Faz 6).
