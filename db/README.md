# Database - Trust Tree

PostgreSQL 16. Lo schema e' definito dalle migrazioni SQL in `migrations/`, applicate in ordine
alfabetico: sono la fonte di verita' dello schema (l'API non usa `synchronize`).

## Avvio

Il database e' il servizio `db` del `docker-compose.yml` in radice:

```bash
docker compose up -d db
```

Alla prima creazione del volume `pgdata` lo script `docker-init.sh` applica tutte le migrazioni.
Connessione dall'host: `postgresql://trust:trust@localhost:5432/trust_tree`.
Dagli altri container l'host e' `db` (stessa rete `trust-tree`), non `localhost`.

## Dati di esempio

```bash
docker compose exec -T db psql -U trust -d trust_tree < db/seed/001_dati_esempio.sql
```

Il set contiene 6 utenti piu' un amministratore, 3 professionisti e 14 recensioni: due
professionisti superano la soglia di pubblicazione, uno resta in costruzione, ed e' presente una
segnalazione V0.

Credenziali di sviluppo: `admin@trusttree.local / admin1234` (ruolo admin) e `trust1234` per
tutti gli utenti di esempio.

## Nuova migrazione

Aggiungere un file `migrations/00N_descrizione.sql` (numerazione progressiva, transazione
esplicita) e applicarlo:

```bash
docker compose exec -T db psql -v ON_ERROR_STOP=1 -U trust -d trust_tree \
  -f /docker-entrypoint-initdb.d/migrations/00N_descrizione.sql
```

Per ricreare il database da zero: `docker compose down -v && docker compose up -d db`.

## Schema

```
utente ──< recensione >── professionista
```

| Tabella | Contenuto |
|---|---|
| `utente` | referente / utente che cerca. `condominio`, `quartiere`, `comune` servono alla prossimita'. |
| `professionista` | soggetto referenziato, con categoria e area operativa. |
| `recensione` | una esperienza: risposte del questionario 1.0, livello di verifica, stato, documento allegato e suo esito. |

Migrazioni applicate:

| File | Contenuto |
|---|---|
| `001_init.sql` | le tre tabelle e i vincoli del questionario 1.0 |
| `002_login_e_documenti.sql` | credenziali e ruolo sull'utente, documento di verifica sulla recensione |
| `003_questionario_completo.sql` | descrizione del lavoro e fascia di importo (domande 2 e 4), tassonomia controllata delle categorie |

Regole applicate a livello di database:

- nessun vincolo di unicita' su `(utente_id, professionista_id)`: un utente puo' lasciare piu'
  recensioni allo stesso professionista;
- i valori delle risposte sono limitati da `CHECK` e riflettono le opzioni del questionario 1.0;
- `motivi` accetta al massimo 2 valori dalla lista chiusa della domanda 13;
- `livello_verifica = 'V0'` (segnalazione, nessuna esperienza personale) impone risposte vuote;
  negli altri livelli `qualita`, `richiamerebbe` e `consiglierebbe` sono obbligatorie;
- `stato = 'esclusa'` toglie la recensione dai conteggi senza cancellarla;
- `documento_stato` diverso da `assente` presuppone un file caricato, il cui percorso non viene
  mai esposto dall'API;
- `categoria_servizio` (recensione) e `categoria` (professionista) accettano solo i valori della
  tassonomia: idraulico, elettricista, fabbro, muratore, imbianchino, giardiniere, impresa_pulizie,
  spurghista, tecnico_caldaie, disinfestatore, tecnico_ascensorista.
