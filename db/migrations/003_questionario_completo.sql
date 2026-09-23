-- Allinea la recensione al "Questionario di referenza 1.0":
--   * domanda 2: la categoria del servizio passa a una tassonomia controllata e la descrizione
--     libera del lavoro diventa un campo a parte (facoltativo, massimo 150 caratteri);
--   * domanda 4: fascia indicativa dell'importo del lavoro (facoltativa).
--
-- La descrizione puo' integrare la classificazione, non sostituirla.

BEGIN;

ALTER TABLE recensione
    ADD COLUMN descrizione_lavoro varchar(150),
    ADD COLUMN fascia_importo text
        CHECK (fascia_importo IN ('meno_100', '100_250', '251_500', '501_1000', '1001_5000', 'oltre_5000'));

-- I dati gia' raccolti avevano la descrizione libera nel campo della categoria: la sposto
-- e riporto la categoria a quella del professionista, che e' sempre un valore di tassonomia.
UPDATE recensione AS r
   SET descrizione_lavoro = left(r.categoria_servizio, 150),
       categoria_servizio = p.categoria
  FROM professionista AS p
 WHERE p.id = r.professionista_id
   AND r.categoria_servizio <> p.categoria;

ALTER TABLE recensione
    ADD CONSTRAINT recensione_categoria_servizio_tassonomia CHECK (
        categoria_servizio IN (
            'idraulico', 'elettricista', 'fabbro', 'muratore',
            'imbianchino', 'giardiniere', 'impresa_pulizie', 'spurghista',
            'tecnico_caldaie', 'disinfestatore', 'tecnico_ascensorista'
        )
    );

-- Anche la categoria del professionista appartiene alla stessa tassonomia.
ALTER TABLE professionista
    ADD CONSTRAINT professionista_categoria_tassonomia CHECK (
        categoria IN (
            'idraulico', 'elettricista', 'fabbro', 'muratore',
            'imbianchino', 'giardiniere', 'impresa_pulizie', 'spurghista',
            'tecnico_caldaie', 'disinfestatore', 'tecnico_ascensorista'
        )
    );

COMMIT;
