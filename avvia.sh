#!/usr/bin/env bash
# Avvia i tre container di Trust Tree (db, api, frontend) e apre il frontend nel browser.
#
#   ./avvia.sh              avvia lo stack e apre http://localhost:8080
#   ./avvia.sh --rebuild    ricostruisce le immagini di api e frontend
#   ./avvia.sh --seed       ricarica i dati di esempio (li sostituisce)
#   ./avvia.sh --no-browser non apre il browser

set -euo pipefail
cd "$(dirname "$0")"

INDIRIZZO="http://localhost:8080"
REBUILD=0
SEED=0
BROWSER=1

for argomento in "$@"; do
    case "$argomento" in
        --rebuild) REBUILD=1 ;;
        --seed) SEED=1 ;;
        --no-browser) BROWSER=0 ;;
        *) echo "Argomento non riconosciuto: $argomento" >&2; exit 1 ;;
    esac
done

echo "==> Avvio dei container (db, api, frontend)"
if [ "$REBUILD" -eq 1 ]; then
    docker compose up -d --build
else
    docker compose up -d
fi

echo "==> Attendo che l'API sia pronta"
for _ in $(seq 1 60); do
    stato=$(docker inspect -f '{{.State.Health.Status}}' trust-tree-api 2>/dev/null || echo starting)
    if [ "$stato" = "healthy" ]; then
        break
    fi
    sleep 2
done
if [ "${stato:-}" != "healthy" ]; then
    echo "Attenzione: l'API non risulta pronta. Log: docker compose logs -f api" >&2
fi

# Al primo avvio il database e' vuoto: carica i dati di esempio.
conteggio=$(docker compose exec -T db psql -U trust -d trust_tree -tAc 'select count(*) from professionista' 2>/dev/null | tr -d '[:space:]' || echo 0)

if [ "$SEED" -eq 1 ] || [ "${conteggio:-0}" = "0" ]; then
    echo "==> Carico i dati di esempio"
    if [ "$SEED" -eq 1 ] && [ "${conteggio:-0}" != "0" ]; then
        docker compose exec -T db psql -q -U trust -d trust_tree \
            -c 'TRUNCATE recensione, utente, professionista CASCADE' > /dev/null
    fi
    docker compose exec -T db psql -q -v ON_ERROR_STOP=1 -U trust -d trust_tree \
        < db/seed/001_dati_esempio.sql > /dev/null
fi

docker compose ps --format '{{.Service}}\t{{.Status}}\t{{.Ports}}'

echo
echo "Frontend:  $INDIRIZZO"
echo "  API:      http://localhost:3000/api  (OpenAPI su /api/docs)"
echo "  Database: postgresql://trust:trust@localhost:5432/trust_tree"
echo "  Log:      docker compose logs -f api"
echo "  Stop:     docker compose down"

if [ "$BROWSER" -eq 1 ]; then
    if command -v xdg-open > /dev/null; then
        xdg-open "$INDIRIZZO" > /dev/null 2>&1 &
    elif command -v open > /dev/null; then
        open "$INDIRIZZO"
    elif command -v start > /dev/null; then
        start "$INDIRIZZO"
    else
        echo "Apri manualmente $INDIRIZZO"
    fi
fi
