# Kreş & Etüt Merkezi Muhasebe Uygulaması

Kreş ve etüt merkezleri için gelir/gider, veli/öğrenci ve temel muhasebe hesaplarını yöneten,
çoklu şube (multi-tenant) destekli, self-hosted web uygulaması.

Proje planı: `kres-etut-muhasebe-plan.md`. Bu doküman **Faz 0** (proje kurulumu), **Faz 1**
(veri modeli ve kimlik doğrulama), **Faz 2** (veli/öğrenci yönetimi), **Faz 3** (hesap planı
ve gelir/gider modülü), **Faz 4** (raporlama ve dashboard), **Faz 5** (güvenlik sertleştirme
ve test) ve **Faz 6** (production Docker paketleme) kapsamında oluşturulan altyapıyı açıklar.

## Gereksinimler

- Node.js **22.x** (Prisma 7, Node 23 gibi tek numaralı sürümleri desteklemez — bkz. `.nvmrc`)
  — sadece yerel geliştirme/seed için gerekir, Docker ile çalıştırmak için gerekmez.
- Docker + Docker Compose

## Hızlı Başlangıç (Docker ile, production)

```bash
cp .env.example .env
# .env içindeki AUTH_SECRET değerini `openssl rand -base64 32` ile üretip değiştirin

docker compose up -d
```

Bu tek komut: Postgres'i ayağa kaldırır, çok aşamalı (multi-stage) production imajını inşa
eder, container başında bekleyen migration'ları otomatik uygular (`prisma migrate deploy`),
uygulamayı `next start` ile production modunda çalıştırır ve günlük otomatik yedeklemeyi
başlatır (bkz. [Yedekleme](#yedekleme-backup)).

Uygulama http://localhost:3000 üzerinde açılır. Sağlık kontrolü: `curl http://localhost:3000/api/health`.

Demo/test verisi yüklemek isterseniz (bkz. [Demo Giriş Bilgileri](#demo-giriş-bilgileri)),
host makinenizden (production imajı `tsx` içermez, bu yüzden seed **container içinde değil**
host'tan çalıştırılır — bkz. [Yerel Geliştirme](#yerel-geliştirme-dockersız-sadece-postgres-containerla)):

```bash
npm install
DATABASE_URL="postgresql://postgres:postgres@localhost:5544/kres_etut_muhasebe?schema=public" npm run db:seed
```

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

## Ekranlar / Özellikler (Faz 5)

- **Brute-force koruması:** Bir hesaba 5 kez yanlış şifre girilirse hesap 15 dakika kilitlenir
  (`User.failedLoginAttempts` / `lockedUntil`, bkz. `src/lib/login-attempts.ts`). Kullanıcı
  sayısı taraması (enumeration) riskini azaltmak için kilitliyken de aynı genel "e-posta veya
  şifre hatalı" mesajı gösterilir. ADMIN, Yönetici Paneli'nde kilitli hesapları görüp **Kilidi
  Aç** ile manuel açabilir.
- **`/admin/audit`** — Denetim kaydı (ADMIN-only): kayıt oluşturma/silme, tutar değişikliği ve
  girişler gibi kritik işlemler `AuditLog`'a yazılır (`src/lib/audit.ts`), bu ekranda aksiyon
  ve varlık türüne göre filtrelenip sayfalanarak görüntülenir.

## Production Docker Paketleme (Faz 6)

- **Çok aşamalı (multi-stage) `Dockerfile`:** `deps` (build için tüm bağımlılıklar) →
  `builder` (`prisma generate` + `next build`) → `prod-deps` (sadece production
  bağımlılıkları — `prisma` CLI, migration'ları çalıştırabilmek için artık bir
  `devDependency` değil, gerçek bir `dependency`) → `runner` (build araçları içermeyen,
  `nextjs` adında ayrıcalıksız bir kullanıcıyla çalışan son imaj). Container her
  başladığında önce `prisma migrate deploy` çalışır, sonra `next start` (production modu,
  `next dev` değil) başlar.
- **Healthcheck:** `GET /api/health` — kimlik doğrulama gerektirmez (bkz. `src/proxy.ts`
  matcher'ı), veritabanına gerçek bir `SELECT 1` sorgusu atarak sadece uygulamanın değil,
  DB bağlantısının da ayakta olduğunu doğrular. Hem `Dockerfile`'daki `HEALTHCHECK`
  hem de `docker-compose.yml`'daki `app.healthcheck` bunu kullanır — `docker ps` çıktısında
  `(healthy)` olarak görünür.
- **Log yönetimi:** Her iki servis de `json-file` log sürücüsünü `max-size: 10m, max-file: 3`
  ile kullanır — loglar diskte sınırsız büyümez, en fazla ~30MB/servis tutulur. Uygulama
  logları `docker compose logs -f app` ile izlenir.
- **Yedekleme (backup):** `backup` servisi (`postgres:16-alpine` imajı, `scripts/backup.sh`)
  container başladığında bir kez, sonrasında her gün 03:00'te (`crond`) otomatik
  `pg_dump | gzip` yedeği alır ve `postgres_backups` volume'üne yazar; varsayılan olarak
  7 günden eski yedekleri siler (`BACKUP_RETENTION_DAYS` ile değiştirilebilir). Elle yedek
  almak: `docker compose exec backup sh /scripts/backup.sh`. Geri yüklemek:
  ```bash
  docker compose exec backup sh -c 'ls -t /backups/*.sql.gz | head -1'   # en son yedeği bul
  docker compose exec backup sh /scripts/restore.sh /backups/<dosya>.sql.gz
  ```
  `pg_dump --clean --if-exists` kullanıldığı için restore, veritabanı boş olsun ya da dolu
  olsun (tablolar zaten var olsun) sorunsuz çalışır — hem "şemayı tamamen sildim" hem de
  "üzerine yaz" senaryoları test edilip doğrulandı.
- **`trustHost: true` (Auth.js):** Self-hosted bir dağıtım, sabit/bilinen bir host adı
  garanti edilemeyeceğinden production modda Auth.js'in varsayılan katı host doğrulamasını
  (`UntrustedHost` hatası — sadece `next start` ile ortaya çıkar, `next dev`'de görülmez)
  devre dışı bırakır.

## Güvenlik Notları

Faz 3 sonrasında yapılan bir güvenlik incelemesinde, `forTenant()`'ın yalnızca bir sorgunun
kendi `tenantId` alanını filtrelediği, formdan gelen yabancı anahtar ID'lerinin (`parentId`,
`accountId` vb.) çağıranın tenant'ına ait olup olmadığını doğrulamadığı bulundu — bu, bir
kullanıcının başka bir şubenin kaydına referans verip verisini görüntüleyebilmesine izin
veriyordu. `src/lib/tenant-db.ts` içindeki `assertOwnedByTenant()` ile kapatıldı ve
`src/lib/tenant-db.test.ts` içinde gerçek bir veritabanına karşı regresyon testi eklendi.
Yeni bir server action yazarken, istemciden gelen ve başka bir modele referans veren her ID
kullanılmadan önce bu fonksiyonla doğrulanmalıdır.

Faz 5'te ayrıca: girdi doğrulama şemaları sıkılaştırıldı (TC Kimlik No formatı, telefon
formatı, tutar üst sınırları), `npm audit` ile bağımlılık taraması yapıldı (kırılmayan
düzeltmeler uygulandı; Prisma'yı büyük bir sürüm geriye almayı gerektiren düzeltmeler bilinçli
olarak atlandı çünkü etkilenen paketler yalnızca Prisma CLI'nin build-zamanı araçlarında ve
kullanmadığımız bir veritabanı sürücüsünde — bkz. commit mesajı), ve RBAC/tenant izolasyonu
için gerçek server action'ları çağıran entegrasyon testleri eklendi.

## Test Kapsamı

`npm run test` ile çalışan testler: şifre hash'leme, rol yetkilendirmesi, giriş kilitleme
mantığı (`src/lib/login-attempts.ts`), borç hesaplama mantığı (`src/lib/debt.ts`), rapor
hesaplamaları (`src/lib/reports.ts`), CSV üretimi, **gerçek bir veritabanına karşı çalışan
multi-tenant izolasyon testi** (`src/lib/tenant-db.test.ts`) ve **RBAC/cross-tenant IDOR
regresyon testleri** (`src/app/(app)/parents/actions.test.ts`,
`src/app/(app)/students/actions.test.ts` — gerçek server action'ları mock'lanmış bir
oturumla çağırıp TEACHER'ın veli oluşturamadığını ve başka bir tenant'ın kaydına referans
verilemeyeceğini doğrular). Bu testlerin çalışması için `DATABASE_URL`'in erişilebilir bir
Postgres'e işaret etmesi gerekir, örn. `docker compose up -d postgres`.

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

## Durum

Plandaki 6 fazın tamamı (Faz 0-6) tamamlandı. **Faz 7 — Opsiyonel/Gelecek Genişletmeler**
(online ödeme entegrasyonu, e-fatura, veli portalı, e-posta/SMS bildirimleri, PWA) kapsam
dışıdır; detaylar için `kres-etut-muhasebe-plan.md`.

Bilinen kapsam kararları:

- Faz 4'teki "şube bazlı kırılım" maddesi eklenmedi — sistemde her ADMIN sadece kendi
  şubesini yönetir, çapraz-şube karşılaştırma yapacak bir platform/süper-admin rolü şu an
  tanımlı değil.
- Yeni bir şube (tenant) veya personel hesabı oluşturmanın UI'dan bir yolu yok — bunlar şu an
  yalnızca `prisma/seed.ts` veya doğrudan veritabanı erişimiyle oluşturulabiliyor. Hiçbir
  fazda "şube/kullanıcı onboarding ekranı" açıkça talep edilmedi; gerçek bir üretim
  dağıtımında bu erken bir öncelik olmalı.
