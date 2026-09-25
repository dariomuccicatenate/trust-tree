-- Utenza del professionista e contestazione delle referenze.
--
--   * utente.ruolo ammette il nuovo valore 'professionista': il tipo di utenza si
--     stabilisce al momento della registrazione e non e' modificabile dall'interessato;
--   * professionista.utente_id collega la scheda all'account che la rappresenta
--     (relazione uno a uno: un account governa una sola scheda);
--   * recensione.contestazione_*: il professionista non modifica ne' cancella la
--     referenza, ma apre una richiesta motivata che l'amministratore decide.
--     Esito accolto  -> la referenza passa a 'esclusa' e non concorre piu' ai punteggi.
--     Esito respinto -> la referenza resta pubblicata, con traccia della richiesta.
--
-- Il dato originario non viene mai cancellato: resta la referenza, resta la richiesta
-- e resta l'esito, con data e autore della decisione.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. terzo ruolo
-- ---------------------------------------------------------------------------
ALTER TABLE utente
    DROP CONSTRAINT IF EXISTS utente_ruolo_check;

ALTER TABLE utente
    ADD CONSTRAINT utente_ruolo_ammesso
        CHECK (ruolo IN ('utente', 'admin', 'professionista'));

-- ---------------------------------------------------------------------------
-- 2. collegamento fra account e scheda
-- ---------------------------------------------------------------------------
ALTER TABLE professionista
    ADD COLUMN IF NOT EXISTS utente_id uuid REFERENCES utente (id) ON DELETE SET NULL;

-- Una scheda ha al massimo un account; un account al massimo una scheda.
CREATE UNIQUE INDEX IF NOT EXISTS idx_professionista_utente
    ON professionista (utente_id)
    WHERE utente_id IS NOT NULL;

COMMENT ON COLUMN professionista.utente_id IS
    'Account di tipo professionista che rappresenta questa scheda. NULL per le schede inserite dall''amministratore e non ancora rivendicate.';

-- ---------------------------------------------------------------------------
-- 3. contestazione della referenza
-- ---------------------------------------------------------------------------
ALTER TABLE recensione
    ADD COLUMN IF NOT EXISTS contestazione_stato text NOT NULL DEFAULT 'nessuna',
    ADD COLUMN IF NOT EXISTS contestazione_motivo text,
    ADD COLUMN IF NOT EXISTS contestazione_dettaglio varchar(500),
    ADD COLUMN IF NOT EXISTS contestazione_aperta_il timestamptz,
    ADD COLUMN IF NOT EXISTS contestazione_aperta_da uuid REFERENCES utente (id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS contestazione_decisa_il timestamptz,
    ADD COLUMN IF NOT EXISTS contestazione_decisa_da uuid REFERENCES utente (id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS contestazione_note_esito varchar(500);

ALTER TABLE recensione
    DROP CONSTRAINT IF EXISTS recensione_contestazione_stato;
ALTER TABLE recensione
    ADD CONSTRAINT recensione_contestazione_stato
        CHECK (contestazione_stato IN ('nessuna', 'aperta', 'accolta', 'respinta'));

ALTER TABLE recensione
    DROP CONSTRAINT IF EXISTS recensione_contestazione_motivo;
ALTER TABLE recensione
    ADD CONSTRAINT recensione_contestazione_motivo
        CHECK (
            contestazione_motivo IS NULL
            OR contestazione_motivo IN (
                'mai_incaricato',      -- non ho mai lavorato per questa persona
                'lavoro_non_mio',      -- il lavoro descritto non e' il mio
                'contenuto_offensivo', -- il commento e' offensivo o diffamatorio
                'dati_errati',         -- dati del lavoro non corretti
                'dati_personali',      -- il commento contiene dati personali
                'altro'
            )
        );

-- Una richiesta aperta o decisa ha sempre motivo, data e autore.
ALTER TABLE recensione
    DROP CONSTRAINT IF EXISTS recensione_contestazione_coerente;
ALTER TABLE recensione
    ADD CONSTRAINT recensione_contestazione_coerente
        CHECK (
            contestazione_stato = 'nessuna'
            OR (contestazione_motivo IS NOT NULL
                AND contestazione_aperta_il IS NOT NULL
                AND contestazione_aperta_da IS NOT NULL)
        );

-- Coda di lavoro dell'amministratore: le richieste ancora da decidere.
CREATE INDEX IF NOT EXISTS idx_recensione_contestazioni_aperte
    ON recensione (contestazione_aperta_il)
    WHERE contestazione_stato = 'aperta';

COMMIT;
