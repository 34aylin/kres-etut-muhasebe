#!/bin/sh
# Bir yedek dosyasından veritabanını geri yükler.
# Kullanım (backup container'ı içinde):
#   docker compose exec backup sh /scripts/restore.sh /backups/kres_etut_muhasebe_YYYYmmdd_HHMMSS.sql.gz
set -eu

FILE="${1:?Kullanım: restore.sh <yedek-dosyası.sql.gz>}"

if [ ! -f "$FILE" ]; then
  echo "Hata: dosya bulunamadı: $FILE" >&2
  exit 1
fi

echo "UYARI: Bu işlem '$POSTGRES_DB' veritabanının ÜZERİNE yazacak."
echo "Devam etmek için 5 saniye içinde Ctrl+C ile iptal edebilirsiniz..."
sleep 5

echo "[restore] $FILE geri yükleniyor..."
gunzip -c "$FILE" | PGPASSWORD="$POSTGRES_PASSWORD" psql \
  -h "$POSTGRES_HOST" \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB"

echo "[restore] tamamlandı."
