#!/bin/sh
# Applica in ordine tutte le migrazioni alla prima inizializzazione del database.
set -e
for f in /docker-entrypoint-initdb.d/migrations/*.sql; do
    echo "==> applico $f"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$f"
done
