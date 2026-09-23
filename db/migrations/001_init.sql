-- Trust Tree - schema iniziale (versione semplificata 1.0)
-- Tre tabelle: utente, professionista, recensione.
-- I valori ammessi delle risposte derivano dal "Questionario di referenza Trust Score 1.0".

BEGIN;

CREATE EXTENSION IF NOT EXISTS citext;

-- ---------------------------------------------------------------------------
-- utente: chi lascia la recensione (referente) e chi effettua le ricerche.
-- condominio/quartiere/comune servono alla prossimita' relazionale e geografica.
-- ---------------------------------------------------------------------------
CREATE TABLE utente (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    email       citext      NOT NULL UNIQUE,
    nome        text        NOT NULL,
    cognome     text        NOT NULL,
    condominio  text,
    quartiere   text,
    comune      text,
    creato_il   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_utente_condominio ON utente (condominio) WHERE condominio IS NOT NULL;
CREATE INDEX idx_utente_zona       ON utente (comune, quartiere);

-- ---------------------------------------------------------------------------
-- professionista: soggetto referenziato. Puo' non avere un account.
-- ---------------------------------------------------------------------------
CREATE TABLE professionista (
    id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    nome       text        NOT NULL,
    categoria  text        NOT NULL,
    telefono   text,
    quartiere  text,
    comune     text,
    creato_il  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_professionista_telefono ON professionista (telefono) WHERE telefono IS NOT NULL;
CREATE INDEX idx_professionista_categoria_zona  ON professionista (categoria, comune);

-- ---------------------------------------------------------------------------
-- recensione: una esperienza dichiarata da un utente su un professionista.
-- Nessun vincolo di unicita': lo stesso utente puo' recensire piu' volte lo
-- stesso professionista (prestazioni o momenti diversi).
-- ---------------------------------------------------------------------------
CREATE TABLE recensione (
    id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    utente_id           uuid        NOT NULL REFERENCES utente (id) ON DELETE CASCADE,
    professionista_id   uuid        NOT NULL REFERENCES professionista (id) ON DELETE CASCADE,

    -- A. identificazione del servizio
    categoria_servizio  text        NOT NULL,
    periodo_utilizzo    text        NOT NULL
        CHECK (periodo_utilizzo IN ('ultimi_3_mesi', '3_6_mesi', '6_12_mesi', '1_2_anni', 'oltre_2_anni')),

    -- B. valutazione oggettiva
    puntualita          text
        CHECK (puntualita IN ('si', 'ritardo_accettabile', 'no', 'non_applicabile')),
    rispetto_prezzo     text
        CHECK (rispetto_prezzo IN ('si', 'si_con_variazioni_concordate', 'no', 'prezzo_non_concordato', 'non_applicabile')),
    completamento       text
        CHECK (completamento IN ('si', 'si_dopo_correzione', 'no', 'non_valutabile')),
    qualita             text
        CHECK (qualita IN ('ottima', 'buona', 'sufficiente', 'insoddisfacente')),
    correttezza         text
        CHECK (correttezza IN ('ottima', 'buona', 'sufficiente', 'insoddisfacente')),

    -- C. domande determinanti
    richiamerebbe       text
        CHECK (richiamerebbe IN ('sicuramente_si', 'probabilmente_si', 'probabilmente_no', 'sicuramente_no')),
    consiglierebbe      text
        CHECK (consiglierebbe IN ('sicuramente_si', 'probabilmente_si', 'probabilmente_no', 'sicuramente_no')),
    problemi_successivi text
        CHECK (problemi_successivi IN ('nessuno', 'risolti_tempestivamente', 'risolti_con_difficolta', 'non_risolti', 'non_valutabile')),

    -- D. referenza qualitativa
    motivi              text[]      NOT NULL DEFAULT '{}'
        CHECK (cardinality(motivi) <= 2
               AND motivi <@ ARRAY['qualita', 'affidabilita', 'puntualita', 'prezzo',
                                   'disponibilita', 'correttezza', 'rapidita', 'risoluzione_problema']::text[]),
    commento            varchar(300),

    -- E. verifica dell'esperienza e stato
    livello_verifica    text        NOT NULL DEFAULT 'V1'
        CHECK (livello_verifica IN ('V0', 'V1', 'V2', 'V3')),
    stato               text        NOT NULL DEFAULT 'pubblicata'
        CHECK (stato IN ('pubblicata', 'esclusa')),

    creato_il           timestamptz NOT NULL DEFAULT now(),

    -- V0 = segnalazione senza esperienza personale: il questionario si ferma alla
    -- prima domanda, quindi le risposte restano vuote. Per gli altri livelli le
    -- due domande determinanti e la qualita' sono obbligatorie.
    CONSTRAINT recensione_risposte_obbligatorie CHECK (
        livello_verifica = 'V0'
        OR (qualita IS NOT NULL AND richiamerebbe IS NOT NULL AND consiglierebbe IS NOT NULL)
    ),
    CONSTRAINT recensione_segnalazione_senza_risposte CHECK (
        livello_verifica <> 'V0'
        OR (puntualita IS NULL AND rispetto_prezzo IS NULL AND completamento IS NULL
            AND qualita IS NULL AND correttezza IS NULL AND richiamerebbe IS NULL
            AND consiglierebbe IS NULL AND problemi_successivi IS NULL
            AND cardinality(motivi) = 0)
    )
);

CREATE INDEX idx_recensione_professionista ON recensione (professionista_id, stato);
CREATE INDEX idx_recensione_utente         ON recensione (utente_id, creato_il DESC);
CREATE INDEX idx_recensione_coppia         ON recensione (professionista_id, utente_id);
CREATE INDEX idx_recensione_categoria      ON recensione (categoria_servizio);

COMMIT;
