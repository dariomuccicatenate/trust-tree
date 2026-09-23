# Frontend - Trust Tree

Angular 16 (componenti standalone, rotte lazy). L'accesso avviene con email e password: il token
JWT viaggia in un interceptor e le rotte sono protette da due guardie (`autenticato`, `admin`).

## Avvio

```bash
npm install
npm start          # http://localhost:4200, proxy /api su http://localhost:3000
```

Con Docker l'app è servita da nginx su http://localhost:8080 (vedi `docker-compose.yml` in radice).

Credenziali di sviluppo (dal seed): `admin@trusttree.local / admin1234` per l'amministratore,
`giulia.neri@example.com / trust1234` per un residente. La pagina di accesso le propone con un clic.

## Schermate

| Rotta | Accesso | Contenuto |
|---|---|---|
| `/login` | libero | due schede: **Accedi** e **Registrati** (nome, cognome, email, password e, facoltativi, condominio/quartiere/comune). Le utenze di prova entrano con un clic; dopo la registrazione l'utente e' gia' autenticato. La barra in alto mostra solo logo e nome, centrati |
| `/ricerca` | autenticato | filtri per testo, categoria e zona; risultati divisi tra reputazione pubblicata (ordinati per `0,6 × Trust Score + 0,4 × Trust Relevance`) e reputazione in costruzione |
| `/professionisti/:id` | autenticato | contatto del professionista, Trust Score e Trust Relevance con formula, componenti, motivazione, referenze, conteggi di verifica. Il contatto è modificabile solo dall'amministratore, direttamente dalla scheda |
| `/professionisti/:id/referenza` | autenticato | questionario 1.0: un passo per sezione (A-E), domande numerate come nel documento, prima domanda come filtro (nessun utilizzo personale → segnalazione V0), categoria da tassonomia + descrizione facoltativa, fascia di importo facoltativa, massimo 2 motivi, commento moderato, tabella dei livelli di verifica e caricamento del documento |
| `/admin` | solo admin | verifica dei documenti caricati e inserimento dei professionisti |

La modale «Come funziona» mostra le due formule e spiega la differenza tra i punteggi.

## Dashboard amministratore

- **Documenti da verificare**: coda per stato (da verificare, approvati, rifiutati) con referente,
  professionista, servizio, nome e dimensione del file, data di caricamento e scadenza di
  conservazione. Il documento si apre in una scheda separata; l'esito è «Approva → V2» (la referenza
  diventa verificata) oppure «Rifiuta» (torna a V1 dichiarata), con nota facoltativa.
- **Aggiungi un professionista**: nome, categoria, telefono e area operativa. Il profilo nasce con
  reputazione in costruzione: l'inserimento non genera reputazione.

## Categorie dei servizi

Tassonomia unica per filtro di ricerca, questionario e inserimento dei professionisti
(`core/etichette.ts`, stessa lista dell'API e dei CHECK del database): idraulico, elettricista,
fabbro, muratore, imbianchino, giardiniere, impresa di pulizie, spurghista, tecnico caldaie,
disinfestatore, tecnico ascensorista.

## Contatto del professionista

Il numero di cellulare e' mostrato nella scheda a tutti gli utenti, come link `tel:`.
Inserimento e modifica passano da `PATCH /api/professionisti/:id`, riservata all'amministratore:
in scheda i pulsanti «Aggiungi contatto» / «Modifica contatto» compaiono solo per il ruolo admin,
e l'API risponde comunque 403 a chiunque altro.

## Cache e deploy

nginx serve `index.html` con `Cache-Control: no-store`, mentre i bundle con hash nel nome hanno
cache di un anno: dopo un nuovo deploy il browser prende sempre la versione aggiornata.

## Colori

Palette a tre colori, definita come token in `src/styles.css` (con le varianti per il tema scuro):

| Token | Valore | Uso |
|---|---|---|
| `--accent-trust` | `#0D47A1` | Trust Score: chip pieno, barre delle componenti, elementi primari |
| `--accent-relevance` | `#1565C0` | Trust Relevance, bottoni principali, link e stati attivi |
| `--ground` / `--surface` | `#EEF2F8` / `#F4F7FB` | bianco tenue di sfondo e delle superfici |
| `--campo-ricerca` | `#FFFFFF` | barra di ricerca e campi dei form, bianco pieno |

Testi, bordi e tinte chiare sono sfumature dei tre colori. Resta un solo rosso funzionale
(`--danger`) per gli errori, perche' in una palette di soli blu un errore non si distinguerebbe.

## SEO della pagina pubblica

`/login` e' l'unica pagina raggiungibile senza account: porta titolo, `description`, `keywords` e
tag Open Graph impostati dal componente, piu' una `description` statica in `src/index.html` per i
crawler che non eseguono JavaScript. Il testo a sinistra del form usa una gerarchia `h2` + elenco
con i termini di ricerca reali (referenze verificate, idraulico, elettricista, impresa edile,
condominio, passaparola).

Per un'indicizzazione piena servirebbe il rendering lato server (Angular Universal): oggi il
contenuto e' generato dal client.

## Struttura

```
src/app/core/        modelli, client API, sessione (auth.service), interceptor, guardie, etichette
src/app/pagine/      login, ricerca, dettaglio, questionario, admin
```

I punteggi **non** sono più calcolati nel browser: arrivano dall'API (`/api/ricerca`,
`/api/professionisti/:id/trust-score`, `/api/professionisti/:id/trust-relevance`), che applica le
formule dei documenti 1.0.

Limite noto del modello dati semplificato: dei cinque livelli di prossimità sono derivabili solo
**D2** (stesso condominio) e **D5** (utente senza collegamenti); D1, D3 e D4 richiedono le relazioni
tra utenti e le comunità, oggi non presenti in database. Una referenza lasciata dall'utente stesso
è trattata come D1.
