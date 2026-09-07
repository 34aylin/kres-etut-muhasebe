#!/bin/sh
# Postgres veritabanının periyodik yedeğini alır ve eski yedekleri temizler.
# Bu script `postgres:16-alpine` imajını kullanan bir `backup` servisinde
# cron (busybox crond) ile çalıştırılır — bkz. docker-compose.yml.
set -eu

BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
FILENAME="${BACKUP_DIR}/kres_etut_muhasebe_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[backup] $(date -Iseconds) — yedek alınıyor: $FILENAME"
PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
  -h "$POSTGRES_HOST" \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  --no-owner --no-acl \
  --clean --if-exists \
  | gzip > "$FILENAME"

echo "[backup] tamamlandı: $(du -h "$FILENAME" | cut -f1)"

echo "[backup] ${RETENTION_DAYS} günden eski yedekler temizleniyor..."
find "$BACKUP_DIR" -name "kres_etut_muhasebe_*.sql.gz" -mtime "+${RETENTION_DAYS}" -delete

echo "[backup] mevcut yedekler:"
ls -lh "$BACKUP_DIR"
