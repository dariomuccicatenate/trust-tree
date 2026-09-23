# API - Trust Tree

API REST in NestJS su tre risorse: `utenti`, `professionisti`, `recensioni`.
Lo schema del database vive nella cartella `../db` (migrazioni SQL): qui `synchronize` e' disattivato
e le entita' TypeORM si limitano a mappare le tabelle esistenti.

## Avvio

```bash
cp .env.example .env      # variabili di connessione al database
npm install
npm run start:dev
```

Il database deve essere attivo: `docker compose up -d db` dalla radice del progetto.
In alternativa l'intero stack (database, API, frontend) parte con `docker compose up -d --build`:
l'API e' costruita dal `Dockerfile` di questa cartella e raggiunge il database all'host `db`.

- base URL: `http://localhost:3000/api`
- documentazione OpenAPI: `http://localhost:3000/api/docs`

## Autenticazione

Accesso con email e password, token JWT nell'header `Authorization: Bearer …`.
Due ruoli: `utente` e `admin`.

| Metodo | Percorso | Descrizione |
|---|---|---|
| POST | `/api/auth/registrazione` | crea un account (ruolo `utente`) e restituisce subito il token |
| POST | `/api/auth/login` | restituisce `accessToken` e profilo |
| GET | `/api/auth/me` | profilo dell'utente autenticato |

La registrazione e' pubblica e crea sempre un utente con ruolo `utente`: il ruolo `admin` si
assegna dal database o da un altro amministratore. Email gia' registrata: 409.

Credenziali di sviluppo nel seed: `admin@trusttree.local / admin1234` (admin) e
`giulia.neri@example.com / trust1234` (e gli altri utenti di esempio).

## Punteggi

Le formule dei documenti 1.0 sono implementate in `src/punteggi/`:

- `TS = 0,25C + 0,20R + 0,15Q + 0,15E + 0,10P + 0,05A + 0,05PR + 0,05V`, con ogni componente
  media ponderata delle risposte valide e peso della referenza
  `verifica × recenza × affidabilità del referente`;
- `TR = 0,45P + 0,25C + 0,15I + 0,10M + 0,05G`, con `W = D × V × R × A` per ogni referenza e
  `S = ΣW` alla base della componente C;
- ordinamento `0,60 × Trust Score + 0,40 × Trust Relevance`, con soglia di salvaguardia.

Tutti i pesi, i coefficienti e le fasce stanno in `src/punteggi/parametri.ts`.

| Metodo | Percorso | Descrizione |
|---|---|---|
| GET | `/api/professionisti/:id/trust-score` | punteggio, componenti e pesi applicati |
| GET | `/api/professionisti/:id/trust-relevance` | rilevanza per l'utente autenticato (`?servizio=`) |
| GET | `/api/ricerca` | professionisti con TS, TR e ranking (`?testo=&categoria=&zona=`) |

## Verifica documentale

| Metodo | Percorso | Descrizione |
|---|---|---|
| POST | `/api/recensioni/:id/documento` | l'autore allega PDF/JPEG/PNG/WebP fino a 5 MB (multipart) |
| GET | `/api/admin/verifiche` | coda per stato (`in_attesa`, `approvato`, `rifiutato`) — solo admin |
| GET | `/api/admin/verifiche/:id/documento` | scarica il file — solo admin |
| POST | `/api/admin/verifiche/:id/approva` | referenza a V2 verificata — solo admin |
| POST | `/api/admin/verifiche/:id/rifiuta` | referenza a V1 dichiarata — solo admin |

I file non sono pubblici: stanno sul volume `DOCUMENTI_DIR` e la riga porta una data di
conservazione (180 giorni dal caricamento).

## Endpoint

### Utenti

| Metodo | Percorso | Descrizione |
|---|---|---|
| POST | `/api/utenti` | registra un utente (solo admin) |
| GET | `/api/utenti` | elenco con filtri `email`, `condominio`, `quartiere`, `comune`, `limit`, `offset` |
| GET | `/api/utenti/:id` | dettaglio |
| PATCH | `/api/utenti/:id` | aggiornamento parziale |
| DELETE | `/api/utenti/:id` | elimina utente e relative recensioni |

### Professionisti

| Metodo | Percorso | Descrizione |
|---|---|---|
| POST | `/api/professionisti` | registra un professionista (solo admin) |
| GET | `/api/professionisti` | elenco con filtri `nome`, `categoria`, `quartiere`, `comune` |
| GET | `/api/professionisti/:id` | dettaglio |
| GET | `/api/professionisti/:id/recensioni` | recensioni ricevute |
| GET | `/api/professionisti/:id/riepilogo` | conteggi e soglie di pubblicazione |
| PATCH | `/api/professionisti/:id` | aggiornamento parziale |
| DELETE | `/api/professionisti/:id` | elimina professionista e relative recensioni |

### Recensioni

| Metodo | Percorso | Descrizione |
|---|---|---|
| POST | `/api/recensioni` | registra una recensione (autore preso dal token) |
| GET | `/api/recensioni` | elenco con filtri `utenteId`, `professionistaId`, `categoriaServizio`, `livelloVerifica`, `stato` |
| GET | `/api/recensioni/:id` | dettaglio con utente e professionista |
| PATCH | `/api/recensioni/:id` | aggiorna risposte o stato (`pubblicata` / `esclusa`) |
| DELETE | `/api/recensioni/:id` | eliminazione definitiva |

### Questionario

| Metodo | Percorso | Descrizione |
|---|---|---|
| GET | `/api/questionario` | le 15 domande nelle sezioni A-E, con testi, obbligatorietà, opzioni e tabella dei livelli di verifica |

## Regole applicate

Derivano dal "Questionario di referenza Trust Score 1.0":

- lo stesso utente puo' lasciare piu' recensioni sullo stesso professionista;
- domanda 2: `categoriaServizio` appartiene alla tassonomia controllata, `descrizioneLavoro` e'
  facoltativa (max 150 caratteri) e la integra senza sostituirla;
- domanda 4: `fasciaImporto` e' facoltativa e non entra nel punteggio;
- `livelloVerifica = V0` e' una segnalazione senza esperienza personale: non accetta risposte
  al questionario e non entra nei conteggi delle esperienze valide;
- per i livelli V1-V3 `qualita`, `richiamerebbe` e `consiglierebbe` sono obbligatorie;
- `motivi` accetta al massimo 2 valori (domanda 13), `commento` al massimo 300 caratteri;
- `stato = esclusa` toglie la recensione dai conteggi conservando il dato originario;
- `GET /professionisti/:id/riepilogo` segnala `reputazioneInCostruzione` finche' non ci sono
  almeno 5 esperienze valide da almeno 3 utenti distinti.

Trust Score e Trust Relevance sono calcolati dall'API (vedi sopra). I pesi della versione 1.0
sono sperimentali e andranno ricalibrati dopo il primo campione significativo.

## Esempio

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"giulia.neri@example.com","password":"trust1234"}' | jq -r .accessToken)

curl -X POST http://localhost:3000/api/recensioni \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "professionistaId": "5e8f1a2b-3c4d-4e5f-9a8b-7c6d5e4f3a2b",
    "categoriaServizio": "riparazione perdita",
    "periodoUtilizzo": "ultimi_3_mesi",
    "puntualita": "si",
    "rispettoPrezzo": "si",
    "completamento": "si",
    "qualita": "ottima",
    "correttezza": "ottima",
    "richiamerebbe": "sicuramente_si",
    "consiglierebbe": "sicuramente_si",
    "problemiSuccessivi": "nessuno",
    "motivi": ["affidabilita", "rapidita"],
    "livelloVerifica": "V2"
  }'
```
