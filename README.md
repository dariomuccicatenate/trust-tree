# Trust Tree

Rete di fiducia professionale basata su referenze di prestazioni realmente eseguite
(documenti di riferimento in `docs/requirements`).

```
db/        schema PostgreSQL: migrazioni SQL, script di init, dati di esempio
api/       API REST NestJS (utenti, professionisti, recensioni, questionario)
frontend/  applicazione Angular (ricerca, scheda professionista, questionario)
```

## Avvio da terminale

Un comando fa tutto: **se Docker non è in esecuzione lo avvia** e ne attende il motore, poi tira su
i tre container, aspetta che l'API sia pronta, carica i dati di esempio se il database è vuoto e
apre il frontend nel browser.

**Windows (PowerShell)**

```powershell
cd C:\dev\trust-tree
.\avvia.ps1
```

**Git Bash, macOS, Linux**

```bash
cd /c/dev/trust-tree
./avvia.sh
```

Il frontend si apre su **http://localhost:8080**.

Credenziali di sviluppo (caricate dal seed):

| Utenza | Password | Ruolo |
|---|---|---|
| `admin@trusttree.local` | `admin1234` | amministratore: verifica i documenti, decide le contestazioni, inserisce i professionisti |
| `giulia.neri@example.com` | `trust1234` | residente del Condominio Girasole |
| `paolo.rizzo@example.com` | `trust1234` | utente senza condominio |
| `mario.rossi@example.com` | `trust1234` | professionista (idraulico), con referenze e una contestazione aperta |
| `luca.bianchi@example.com` | `trust1234` | professionista (elettricista), reputazione in costruzione |

Se PowerShell blocca lo script per la execution policy:
`powershell -ExecutionPolicy Bypass -File .\avvia.ps1`.

### Opzioni

```powershell
.\avvia.ps1 -Rebuild      # ricostruisce le immagini dopo modifiche a api/ o frontend/
.\avvia.ps1 -Seed         # ricarica i dati di esempio sostituendo quelli presenti
.\avvia.ps1 -NoBrowser    # non apre il browser
```

Le stesse opzioni in bash sono `--rebuild`, `--seed`, `--no-browser`.

### Stop e comandi utili

```bash
docker compose down        # ferma i tre container, i dati restano nel volume pgdata
docker compose down -v     # ferma e cancella anche i dati
docker compose ps          # stato dei container
docker compose logs -f api # log di un servizio
```

### Avvio a mano, senza script

```bash
docker compose up -d --build
docker compose exec -T db psql -U trust -d trust_tree < db/seed/001_dati_esempio.sql
```

## I tre container

| Servizio | Immagine | Indirizzo | Note |
|---|---|---|---|
| `db` | postgres:16-alpine | `postgresql://trust:trust@localhost:5432/trust_tree` | migrazioni applicate alla creazione del volume; quelle nuove le applica `avvia` |
| `api` | build `./api` | http://localhost:3000/api (OpenAPI su `/api/docs`) | si collega a `db` per nome di servizio |
| `frontend` | build `./frontend` (nginx) | http://localhost:8080 | inoltra `/api/` a `http://api:3000` |

Stanno sulla rete `trust-tree`: il frontend parla con l'API e l'API con il database usando i nomi
dei servizi, non `localhost`. Le dipendenze sono ordinate: `api` parte quando il database è
*healthy*, `frontend` dopo l'API.

## Sviluppo senza container

```bash
docker compose up -d db                       # solo il database
cd api && cp .env.example .env && npm install && npm run start:dev
cd frontend && npm install && npm start       # proxy su localhost:3000
```

## Modello dati

```
utente ──< recensione >── professionista
```

Un utente può lasciare più recensioni allo stesso professionista. Dettagli in `db/README.md`.

## Punteggi

Le formule dei documenti 1.0 sono implementate nell'API (`api/src/punteggi/`):

- Trust Score: `TS = 0,25C + 0,20R + 0,15Q + 0,15E + 0,10P + 0,05A + 0,05PR + 0,05V`, con ogni
  componente media ponderata delle risposte valide e peso della referenza
  `verifica × recenza × affidabilità del referente`;
- Trust Relevance: `TR = 0,45P + 0,25C + 0,15I + 0,10M + 0,05G`, con `W = D × V × R × A`;
- ordinamento dei risultati: `0,60 × Trust Score + 0,40 × Trust Relevance`.

Pesi, coefficienti e soglie stanno tutti in `api/src/punteggi/parametri.ts`: la versione 1.0 è
sperimentale e va ricalibrata dopo il primo campione significativo.

## Accesso, ruoli e amministrazione

Login con email e password (JWT). **Il tipo di utenza si stabilisce alla registrazione** e non è
modificabile dall'interessato: la pagina di accesso ha la registrazione del residente e, sotto, il
collegamento alla registrazione del professionista.

| Ruolo | Come nasce | Dove entra |
|---|---|---|
| `utente` | registrazione pubblica | `/ricerca`: cerca professionisti e lascia referenze |
| `professionista` | registrazione pubblica come professionista (crea account **e** scheda) | `/area-professionista`: solo le referenze ricevute, niente ricerca |
| `admin` | solo dal database o da un altro amministratore | `/admin` |

L'amministratore su `/admin`:

- **verifica i documenti caricati** a supporto delle referenze: un documento approvato porta la
  referenza da V1 dichiarata a V2 verificata, un rifiuto la riporta a V1;
- **decide le contestazioni** aperte dai professionisti: accolta → la referenza passa a `esclusa` e
  non concorre più ai punteggi (resta nello storico, non viene cancellata); respinta → resta
  pubblicata. La nota della decisione è visibile al professionista;
- **aggiunge professionisti**, che nascono con reputazione in costruzione.

Il professionista su `/area-professionista` vede la propria scheda, il Trust Score e tutte le
referenze ricevute, e può chiederne la contestazione. Su `/area-professionista/profilo` aggiorna da
solo **contatto, zona e comune**; nome della scheda e categoria restano all'amministratore, perché
sono i dati su cui si è formata la reputazione già raccolta. Due regole di progetto:

- **le referenze gli arrivano anonime**: l'API non espone l'autore, non è un campo nascosto lato
  interfaccia;
- **non può lasciare referenze sulla propria scheda** e non può modificare né cancellare quelle
  ricevute: può solo aprire una richiesta motivata.

I documenti non sono pubblici: restano sul volume `documenti` e sono scaricabili solo dall'admin.
