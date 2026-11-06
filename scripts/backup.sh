#!/usr/bin/env bash
# ========================================================================
# SW Service Desk v1.0 - Procedimento de Backup de Produção
# Empresa: SW Cloud Solutions
# ========================================================================

set -euo pipefail

# 1. Carregar variáveis do .env se existir
ENV_FILE="$(dirname "$0")/../.env"
if [ -f "$ENV_FILE" ]; then
    # shellcheck disable=SC1090
    export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-sw_servicedesk}"
DB_USER="${DB_USER:-sw_user}"
DB_PASSWORD="${DB_PASSWORD:-}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/sw-servicedesk}"
UPLOADS_DIR="${UPLOADS_DIR:-$(dirname "$0")/../uploads}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/backup_sw_servicedesk_${TIMESTAMP}.sql.gz"
ATTACHMENTS_FILE="${BACKUP_DIR}/attachments_sw_servicedesk_${TIMESTAMP}.tar.gz"

echo "=== SW Service Desk v1.0 - Início do Backup de Produção [${TIMESTAMP}] ==="

mkdir -p "$BACKUP_DIR"

# 2. Dump da Base de Dados MySQL / MariaDB
echo "[1/3] A efetuar mysqldump consistente da base de dados '${DB_NAME}'..."
if [ -n "$DB_PASSWORD" ]; then
    MYSQL_PWD="$DB_PASSWORD" mysqldump \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --user="$DB_USER" \
        --single-transaction \
        --quick \
        --routines \
        --triggers \
        --events \
        --default-character-set=utf8mb4 \
        "$DB_NAME" | gzip -9 > "$BACKUP_FILE"
else
    mysqldump \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --user="$DB_USER" \
        --single-transaction \
        --quick \
        --routines \
        --triggers \
        --events \
        --default-character-set=utf8mb4 \
        "$DB_NAME" | gzip -9 > "$BACKUP_FILE"
fi

echo " -> Base de dados guardada com sucesso em: ${BACKUP_FILE} ($(du -h "$BACKUP_FILE" | cut -f1))"

# 3. Cópia de Anexos
echo "[2/3] A arquivar ficheiros de anexo em '${UPLOADS_DIR}'..."
if [ -d "$UPLOADS_DIR" ]; then
    tar -czf "$ATTACHMENTS_FILE" -C "$UPLOADS_DIR" .
    echo " -> Anexos arquivados com sucesso em: ${ATTACHMENTS_FILE} ($(du -h "$ATTACHMENTS_FILE" | cut -f1))"
else
    echo " -> Diretório de anexos não encontrado, a ignorar cópia de ficheiros."
fi

# 4. Rotação de Backups Antigos (Manter últimos 30 dias)
echo "[3/3] A executar política de retenção (expurgar backups > 30 dias)..."
find "$BACKUP_DIR" -name "backup_sw_servicedesk_*.sql.gz" -mtime +30 -delete || true
find "$BACKUP_DIR" -name "attachments_sw_servicedesk_*.tar.gz" -mtime +30 -delete || true

echo "=== Backup concluído com sucesso às $(date +"%Y-%m-%d %H:%M:%S") ==="
