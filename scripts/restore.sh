#!/usr/bin/env bash
# ========================================================================
# SW Service Desk v1.0 - Procedimento de Restauro de Produção (Disaster Recovery)
# Empresa: SW Cloud Solutions
# ========================================================================

set -euo pipefail

if [ "$#" -lt 1 ]; then
    echo "Uso: $0 <caminho_do_ficheiro_backup.sql.gz ou .sql> [caminho_attachments.tar.gz]"
    echo "Exemplo: $0 /var/backups/sw-servicedesk/backup_sw_servicedesk_20261106_120000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"
ATTACHMENTS_FILE="${2:-}"

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
UPLOADS_DIR="${UPLOADS_DIR:-$(dirname "$0")/../uploads}"

echo "========================================================================"
echo " AVISO CRÍTICO: PROCEDIMENTO DE RESTAURO DE BASE DE DADOS"
echo " Todos os dados atuais em '${DB_NAME}' serão substituídos pelo backup:"
echo " ${BACKUP_FILE}"
echo "========================================================================"
read -p "Tem a certeza que deseja prosseguir com o restauro? (digite 'CONFIRMAR'): " CONFIRMATION

if [ "$CONFIRMATION" != "CONFIRMAR" ]; then
    echo "Operação abortada pelo operador."
    exit 0
fi

echo "[1/2] A restaurar base de dados MySQL em '${DB_NAME}'..."
if [[ "$BACKUP_FILE" == *.gz ]]; then
    if [ -n "$DB_PASSWORD" ]; then
        gzip -dc "$BACKUP_FILE" | MYSQL_PWD="$DB_PASSWORD" mysql \
            --host="$DB_HOST" \
            --port="$DB_PORT" \
            --user="$DB_USER" \
            --default-character-set=utf8mb4 \
            "$DB_NAME"
    else
        gzip -dc "$BACKUP_FILE" | mysql \
            --host="$DB_HOST" \
            --port="$DB_PORT" \
            --user="$DB_USER" \
            --default-character-set=utf8mb4 \
            "$DB_NAME"
    fi
else
    if [ -n "$DB_PASSWORD" ]; then
        MYSQL_PWD="$DB_PASSWORD" mysql \
            --host="$DB_HOST" \
            --port="$DB_PORT" \
            --user="$DB_USER" \
            --default-character-set=utf8mb4 \
            "$DB_NAME" < "$BACKUP_FILE"
    else
        mysql \
            --host="$DB_HOST" \
            --port="$DB_PORT" \
            --user="$DB_USER" \
            --default-character-set=utf8mb4 \
            "$DB_NAME" < "$BACKUP_FILE"
    fi
fi
echo " -> Base de dados restaurada com sucesso!"

if [ -n "$ATTACHMENTS_FILE" ] && [ -f "$ATTACHMENTS_FILE" ]; then
    echo "[2/2] A restaurar diretório de anexos..."
    mkdir -p "$UPLOADS_DIR"
    tar -xzf "$ATTACHMENTS_FILE" -C "$UPLOADS_DIR"
    echo " -> Anexos restaurados com sucesso em ${UPLOADS_DIR}!"
fi

echo "=== Restauro do SW Service Desk v1.0 concluído com sucesso! ==="
