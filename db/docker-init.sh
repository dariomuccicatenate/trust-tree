#!/bin/sh
# Applica in ordine tutte le migrazioni alla prima inizializzazione del database
# e ne registra il nome, cosi' gli avvii successivi applicano solo le nuove
# (si veda la funzione corrispondente in avvia.ps1 / avvia.sh).
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c \
    'CREATE TABLE IF NOT EXISTS migrazione_applicata (
         nome         text PRIMARY KEY,
         applicata_il timestamptz NOT NULL DEFAULT now()
     )'

for f in /docker-entrypoint-initdb.d/migrations/*.sql; do
    nome=$(basename "$f")
    echo "==> applico $nome"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$f"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c \
        "INSERT INTO migrazione_applicata (nome) VALUES ('$nome') ON CONFLICT DO NOTHING"
done
