-- Accesso degli utenti e verifica documentale delle referenze.
--   * utente: credenziali e ruolo (utente / admin)
--   * recensione: documento allegato alla domanda 15 e suo stato di verifica
--
-- Il documento non e' pubblico: viene conservato per il tempo necessario alla verifica e
-- l'esito determina il livello di verifica della referenza (V1 dichiarata -> V2 verificata).

BEGIN;

ALTER TABLE utente
    ADD COLUMN password_hash text,
    ADD COLUMN ruolo text NOT NULL DEFAULT 'utente'
        CHECK (ruolo IN ('utente', 'admin'));

CREATE INDEX idx_utente_ruolo ON utente (ruolo) WHERE ruolo = 'admin';

ALTER TABLE recensione
    ADD COLUMN documento_nome text,
    ADD COLUMN documento_mime text,
    ADD COLUMN documento_dimensione integer,
    ADD COLUMN documento_percorso text,
    ADD COLUMN documento_caricato_il timestamptz,
    ADD COLUMN documento_stato text NOT NULL DEFAULT 'assente'
        CHECK (documento_stato IN ('assente', 'in_attesa', 'approvato', 'rifiutato')),
    ADD COLUMN documento_conservazione_fino_al date,
    ADD COLUMN verificato_da uuid REFERENCES utente (id) ON DELETE SET NULL,
    ADD COLUMN verificato_il timestamptz,
    ADD COLUMN note_verifica text;

-- Uno stato diverso da "assente" presuppone un file caricato.
ALTER TABLE recensione
    ADD CONSTRAINT recensione_documento_coerente CHECK (
        documento_stato = 'assente' OR documento_percorso IS NOT NULL
    );

CREATE INDEX idx_recensione_documenti_da_verificare
    ON recensione (documento_caricato_il)
    WHERE documento_stato = 'in_attesa';

COMMIT;
