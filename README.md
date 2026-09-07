# Kreş & Etüt Merkezi Muhasebe Uygulaması

Kreş ve etüt merkezleri için gelir/gider, veli/öğrenci ve temel muhasebe hesaplarını yöneten,
çoklu şube (multi-tenant) destekli, self-hosted web uygulaması.

Proje planı: `kres-etut-muhasebe-plan.md`. Bu doküman **Faz 0** (proje kurulumu), **Faz 1**
(veri modeli ve kimlik doğrulama), **Faz 2** (veli/öğrenci yönetimi), **Faz 3** (hesap planı
ve gelir/gider modülü) ve **Faz 4** (raporlama ve dashboard) kapsamında oluşturulan altyapıyı
açıklar.

## Gereksinimler

- Node.js **22.x** (Prisma 7, Node 23 gibi tek numaralı sürümleri desteklemez — bkz. `.nvmrc`)
- Docker + Docker Compose

## Hızlı Başlangıç (Docker ile)

```bash
cp .env.example .env
# .env içindeki AUTH_SECRET değerini `openssl rand -base64 32` ile üretip değiştirin

docker compose up -d --build
docker compose exec app npx tsx prisma/seed.ts   # demo tenant/kullanıcı verisi
```

Uygulama http://localhost:3000 üzerinde açılır.

> Not: Host makinenizde 3000 veya 5432 portları başka bir servis tarafından kullanılıyorsa,
> `docker-compose.yml` içindeki `POSTGRES_HOST_PORT` (varsayılan 5544) ve `app.ports`
> değerlerini `.env` üzerinden değiştirebilirsiniz.

## Yerel Geliştirme (Docker'sız, sadece Postgres container'la)

```bash
npm install
docker compose up -d postgres
npm run db:migrate     # prisma migrate dev
npm run db:seed        # demo veri
npm run dev
```

## Demo Giriş Bilgileri

Seed script iki demo tenant (şube) ve her biri için 3 roldeki kullanıcıyı oluşturur.
Şifre tüm kullanıcılar için aynıdır: **`Demo1234!`**

| Tenant        | Yönetici                  | Muhasebe                  | Öğretmen/Personel         |
| ------------- | ------------------------- | ------------------------- | ------------------------- |
| `merkez-sube` | yonetici@merkez-sube.test | muhasebe@merkez-sube.test | ogretmen@merkez-sube.test |
| `yildiz-sube` | yonetici@yildiz-sube.test | muhasebe@yildiz-sube.test | ogretmen@yildiz-sube.test |

`/admin` sayfası sadece ADMIN rolüne açıktır ve yalnızca oturumun bağlı olduğu tenant'ın
kullanıcılarını listeleyerek tenant izolasyonunu görsel olarak doğrular.

## Ekranlar (Faz 2)

- **`/parents`** — Veli listesi (arama + sayfalama), oluşturma/düzenleme/silme.
- **`/students`** — Öğrenci listesi (arama + durum filtresi + sayfalama), oluşturma/silme.
- **`/students/[id]`** — Öğrenci detayı: bağlı veliler (kardeş/çoklu veli desteği için
  ekle/kaldır) ve kayıtlar (Enrollment: kreş/etüt programı, tarih, durum) yönetimi.
- **`/admin/sube`** — Şube (tenant) adını düzenleme (yalnızca ADMIN).

**Rol bazlı görünürlük:** ADMIN ve ACCOUNTANT veli/öğrenci/kayıt verilerini
oluşturabilir/düzenleyebilir/silebilir. TEACHER rolü bu verileri yalnızca görüntüleyebilir
(salt okunur) — hem arayüzde işlem butonları gizlenir hem de server action'lar
(`src/app/(app)/parents/actions.ts`, `students/actions.ts`) sunucu tarafında
`canManageRecords()` ile bu kısıtı zorunlu kılar.

## Ekranlar (Faz 3)

- **`/accounts`** — Kasa/Banka hesapları (bakiye gösterimi ile) ve Gelir/Gider kategorileri
  yönetimi (iki sekme). Hesap/kategori silinmez, geçmişi bozmamak için pasifleştirilir.
- **`/transactions`** — Tüm gelir/gider hareketlerinin listesi (tür filtresi + sayfalama) ve
  yeni hareket girişi (kasa/banka hesabı, kategori, opsiyonel veli/öğrenci, ödeme yöntemi).
- **`/parents/[id]`** — Veli detayı: toplam tahakkuk/ödenen/kalan borç özeti, ücret planları
  (taksitli aidat — oluşturduğunuzda taksit sayısı kadar borç kaydı otomatik üretilir) ve
  borç/tahsilat dökümü (her borç satırından "Tahsilat Al" ile ödeme kaydedilir).

**Hesap bakiyeleri ve borç durumu saklanmaz, anlık hesaplanır:** Bir kasa/banka hesabının
bakiyesi = o hesaba bağlı gelir hareketleri toplamı − gider hareketleri toplamı. Bir borcun
kalan tutarı = borç tutarı − o borca bağlı tahsilatların toplamı. Bu sayede bakiye/borç
tutarsızlığı (drift) riski olmaz; her sorgu güncel veriden hesaplanır.

**Veli bazlı borç takibi:** `Charge` (tahakkuk/borç) ile `Transaction` (gerçekleşen
tahsilat/ödeme) ayrı kavramlardır. `FeePlan` bir taksit planı tanımlar ve oluşturulduğunda
`installmentCount` kadar `Charge` kaydı otomatik üretir (örn. "10 taksit x 500₺ aylık aidat" →
10 ayrı borç kaydı, her biri bir sonraki ayın aynı gününde vadeli).

## Ekranlar (Faz 4)

- **`/reports`** — Tarih aralığı seçimi (Bu Ay / Bu Yıl / özel), seçili aralık için toplam
  gelir/gider/net (kâr-zarar), son 12 ayın gelir-gider trend grafiği, gelir ve gider
  kategorilerine göre kırılım, kasa/banka bakiye raporu, veli borç/alacak listesi. Gelir/gider
  hareketleri ve borç listesi CSV olarak dışa aktarılabilir (Excel uyumlu, UTF-8 BOM'lu).
  Sadece ADMIN ve ACCOUNTANT erişebilir (hem sayfa hem `/api/reports/*` uç noktaları sunucu
  tarafında da bu kısıtı zorunlu kılar).

## Güvenlik Notları

Faz 3 sonrasında yapılan bir güvenlik incelemesinde, `forTenant()`'ın yalnızca bir sorgunun
kendi `tenantId` alanını filtrelediği, formdan gelen yabancı anahtar ID'lerinin (`parentId`,
`accountId` vb.) çağıranın tenant'ına ait olup olmadığını doğrulamadığı bulundu — bu, bir
kullanıcının başka bir şubenin kaydına referans verip verisini görüntüleyebilmesine izin
veriyordu. `src/lib/tenant-db.ts` içindeki `assertOwnedByTenant()` ile kapatıldı ve
`src/lib/tenant-db.test.ts` içinde gerçek bir veritabanına karşı regresyon testi eklendi.
Yeni bir server action yazarken, istemciden gelen ve başka bir modele referans veren her ID
kullanılmadan önce bu fonksiyonla doğrulanmalıdır.

## Test Kapsamı

`npm run test` ile çalışan testler: şifre hash'leme, rol yetkilendirmesi, borç hesaplama
mantığı (`src/lib/debt.ts`), rapor hesaplamaları (`src/lib/reports.ts`), CSV üretimi ve
**gerçek bir veritabanına karşı çalışan multi-tenant izolasyon testi**
(`src/lib/tenant-db.test.ts` — bu testin çalışması için `DATABASE_URL`'in erişilebilir bir
Postgres'e işaret etmesi gerekir, örn. `docker compose up -d postgres`).

| Komut                | Açıklama                                             |
| -------------------- | ---------------------------------------------------- |
| `npm run dev`        | Geliştirme sunucusu                                  |
| `npm run build`      | Prodüksiyon build                                    |
| `npm run lint`       | ESLint                                               |
| `npm run format`     | Prettier ile biçimlendirme                           |
| `npm run test`       | Vitest ile birim testler                             |
| `npm run db:migrate` | Yeni migration oluştur/uygula (`prisma migrate dev`) |
| `npm run db:seed`    | Demo veri yükle                                      |
| `npm run db:studio`  | Prisma Studio                                        |

## Mimari Notları (Faz 1)

- **Multi-tenant izolasyon:** Her tenant'a bağlı model (`User`, `Parent`, `Student`,
  `StudentParent`, `AuditLog`) `tenantId` alanı taşır. Uygulama kodu bu modellere doğrudan
  `prisma` client'ı ile değil, `src/lib/tenant-db.ts` içindeki `forTenant(tenantId)` ile
  erişmelidir — bu fonksiyon Prisma Client Extension kullanarak tüm sorgulara otomatik
  `tenantId` filtresi ekler ve yeni kayıtlara otomatik `tenantId` atar.
- **Kimlik doğrulama:** Auth.js (NextAuth v5) Credentials provider + JWT oturum stratejisi.
  Giriş email üzerinden global olarak (tenant'lar arası) benzersizdir; oturum token'ı
  `tenantId`, `role`, `tenantSlug` bilgilerini taşır.
- **Rol bazlı route koruması:** `src/proxy.ts` (Next.js'in yeni "proxy" dosya konvansiyonu,
  eski adıyla middleware) oturum kontrolü yapar; `/admin` örnek rotası sadece `ADMIN` rolüne
  açıktır.
- **Prisma 7:** `prisma.config.ts` (bu projede `prisma7.config.ts` olarak üretildi) ve
  `@prisma/adapter-pg` driver adapter kullanır; schema dosyasında `datasource.url` artık
  desteklenmez.

## Kapsam Dışı (sonraki fazlar)

Güvenlik sertleştirme — rate limiting, brute-force koruması, audit log ekranı (Faz 5),
production Docker paketleme (Faz 6) — detaylar için `kres-etut-muhasebe-plan.md`.

Not: Faz 4'teki "şube bazlı kırılım" maddesi kapsam dışı bırakıldı — sistemde her ADMIN
sadece kendi şubesini yönetir, çapraz-şube karşılaştırma yapacak bir platform/süper-admin
rolü şu an tanımlı değil.
