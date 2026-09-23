-- Dati di esempio per lo sviluppo locale e per la demo del frontend.
-- Contengono abbastanza referenze perche' almeno due professionisti superino la soglia
-- di pubblicazione (5 esperienze valide da 3 utenti distinti).
--
-- Credenziali (solo sviluppo):
--   admin@trusttree.local / admin1234   -> ruolo admin
--   giulia.neri@example.com e gli altri / trust1234
--
-- Uso: docker compose exec -T db psql -U trust -d trust_tree < db/seed/001_dati_esempio.sql

BEGIN;

INSERT INTO utente (id, email, nome, cognome, condominio, quartiere, comune, password_hash, ruolo) VALUES
    ('3f6d1b8e-9c1a-4f2b-8d3e-1a2b3c4d5e6f', 'giulia.neri@example.com', 'Giulia', 'Neri',
     'Condominio Girasole', 'EUR', 'Roma',
     '$2b$10$VlSmUfao8oAVkp/GuOZrROZm.KICWP8uMEcUr7ATVuZ0HJWsGBnBS', 'utente'),
    ('7a2c4e60-5b3d-4c81-9f2a-6d8e0b1c3a55', 'marco.bruni@example.com', 'Marco', 'Bruni',
     'Condominio Girasole', 'EUR', 'Roma',
     '$2b$10$VlSmUfao8oAVkp/GuOZrROZm.KICWP8uMEcUr7ATVuZ0HJWsGBnBS', 'utente'),
    ('c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f', 'sara.conti@example.com', 'Sara', 'Conti',
     'Condominio Acero', 'Ostiense', 'Roma',
     '$2b$10$VlSmUfao8oAVkp/GuOZrROZm.KICWP8uMEcUr7ATVuZ0HJWsGBnBS', 'utente'),
    ('2b9c8d7e-6f50-4a3b-9c2d-1e0f9a8b7c6d', 'luca.ferri@example.com', 'Luca', 'Ferri',
     'Condominio Acero', 'Ostiense', 'Roma',
     '$2b$10$VlSmUfao8oAVkp/GuOZrROZm.KICWP8uMEcUr7ATVuZ0HJWsGBnBS', 'utente'),
    ('4d3c2b1a-0f9e-4d8c-8b7a-6950e4f3d2c1', 'elena.mori@example.com', 'Elena', 'Mori',
     'Condominio Tiglio', 'Portuense', 'Roma',
     '$2b$10$VlSmUfao8oAVkp/GuOZrROZm.KICWP8uMEcUr7ATVuZ0HJWsGBnBS', 'utente'),
    ('8e7d6c5b-4a39-4b2c-9d1e-0f8a7b6c5d4e', 'paolo.rizzo@example.com', 'Paolo', 'Rizzo',
     NULL, 'Flaminio', 'Roma',
     '$2b$10$VlSmUfao8oAVkp/GuOZrROZm.KICWP8uMEcUr7ATVuZ0HJWsGBnBS', 'utente')
ON CONFLICT (id) DO NOTHING;

-- Amministratore: verifica i documenti caricati e inserisce i professionisti.
INSERT INTO utente (id, email, nome, cognome, condominio, quartiere, comune, password_hash, ruolo) VALUES
    ('0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d', 'admin@trusttree.local', 'Admin', 'Trust Tree',
     NULL, NULL, 'Roma',
     '$2b$10$DudQzyi/99VQTDd89SVgs.ko8/6IORLJhc0fXw1ctMSbpwqKjTr2O', 'admin')
ON CONFLICT (id) DO NOTHING;

INSERT INTO professionista (id, nome, categoria, telefono, quartiere, comune) VALUES
    ('5e8f1a2b-3c4d-4e5f-9a8b-7c6d5e4f3a2b', 'Mario Rossi',  'idraulico',    '+390600000001', 'EUR',       'Roma'),
    ('9b7a6c5d-4e3f-4a2b-8c1d-0e9f8a7b6c5d', 'Luca Bianchi', 'elettricista', '+390600000002', 'Ostiense',  'Roma'),
    ('6c5d4e3f-2a1b-4c9d-8e7f-5a4b3c2d1e0f', 'Teknoass',     'idraulico',    '+390600000003', 'Portuense', 'Roma')
ON CONFLICT (id) DO NOTHING;

-- Mario Rossi: reputazione pubblicata, due referenze nel Condominio Girasole.
INSERT INTO recensione (
    utente_id, professionista_id, categoria_servizio, periodo_utilizzo,
    puntualita, rispetto_prezzo, completamento, qualita, correttezza,
    richiamerebbe, consiglierebbe, problemi_successivi, motivi, commento, livello_verifica,
    creato_il
) VALUES
    ('3f6d1b8e-9c1a-4f2b-8d3e-1a2b3c4d5e6f', '5e8f1a2b-3c4d-4e5f-9a8b-7c6d5e4f3a2b',
     'riparazione perdita', 'ultimi_3_mesi',
     'si', 'si', 'si', 'ottima', 'ottima',
     'sicuramente_si', 'sicuramente_si', 'nessuno',
     ARRAY['affidabilita', 'rapidita'], 'Intervento risolto in giornata.', 'V2',
     now() - interval '37 days'),
    ('7a2c4e60-5b3d-4c81-9f2a-6d8e0b1c3a55', '5e8f1a2b-3c4d-4e5f-9a8b-7c6d5e4f3a2b',
     'sostituzione caldaia', '6_12_mesi',
     'ritardo_accettabile', 'si_con_variazioni_concordate', 'si', 'buona', 'ottima',
     'probabilmente_si', 'sicuramente_si', 'risolti_tempestivamente',
     ARRAY['qualita', 'correttezza'], NULL, 'V1',
     now() - interval '74 days'),
    ('c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f', '5e8f1a2b-3c4d-4e5f-9a8b-7c6d5e4f3a2b',
     'rifacimento bagno', '3_6_mesi',
     'si', 'si', 'si', 'ottima', 'buona',
     'sicuramente_si', 'sicuramente_si', 'nessuno',
     ARRAY['qualita', 'affidabilita'], 'Preventivo rispettato al centesimo.', 'V3',
     now() - interval '111 days'),
    ('2b9c8d7e-6f50-4a3b-9c2d-1e0f9a8b7c6d', '5e8f1a2b-3c4d-4e5f-9a8b-7c6d5e4f3a2b',
     'riparazione perdita', '1_2_anni',
     'si', 'si', 'si_dopo_correzione', 'buona', 'buona',
     'probabilmente_si', 'probabilmente_si', 'risolti_tempestivamente',
     ARRAY['disponibilita'], NULL, 'V1',
     now() - interval '148 days'),
    ('4d3c2b1a-0f9e-4d8c-8b7a-6950e4f3d2c1', '5e8f1a2b-3c4d-4e5f-9a8b-7c6d5e4f3a2b',
     'sostituzione rubinetti', '6_12_mesi',
     'si', 'si', 'si', 'ottima', 'ottima',
     'sicuramente_si', 'sicuramente_si', 'nessuno',
     ARRAY['rapidita', 'prezzo'], 'Richiamato due volte, sempre puntuale.', 'V2',
     now() - interval '185 days'),
    ('8e7d6c5b-4a39-4b2c-9d1e-0f8a7b6c5d4e', '5e8f1a2b-3c4d-4e5f-9a8b-7c6d5e4f3a2b',
     'manutenzione impianto', 'oltre_2_anni',
     'ritardo_accettabile', 'si', 'si', 'buona', 'buona',
     'probabilmente_si', 'probabilmente_si', 'nessuno',
     ARRAY['correttezza'], NULL, 'V1',
     now() - interval '222 days');

-- Teknoass: reputazione pubblicata ma fuori dal condominio e dal quartiere di Giulia.
INSERT INTO recensione (
    utente_id, professionista_id, categoria_servizio, periodo_utilizzo,
    puntualita, rispetto_prezzo, completamento, qualita, correttezza,
    richiamerebbe, consiglierebbe, problemi_successivi, motivi, commento, livello_verifica,
    creato_il
) VALUES
    ('4d3c2b1a-0f9e-4d8c-8b7a-6950e4f3d2c1', '6c5d4e3f-2a1b-4c9d-8e7f-5a4b3c2d1e0f',
     'riparazione scarico', 'ultimi_3_mesi',
     'si', 'si', 'si', 'ottima', 'ottima',
     'sicuramente_si', 'sicuramente_si', 'nessuno',
     ARRAY['affidabilita', 'qualita'], NULL, 'V2',
     now() - interval '259 days'),
    ('8e7d6c5b-4a39-4b2c-9d1e-0f8a7b6c5d4e', '6c5d4e3f-2a1b-4c9d-8e7f-5a4b3c2d1e0f',
     'sostituzione boiler', '3_6_mesi',
     'si', 'si', 'si', 'ottima', 'ottima',
     'sicuramente_si', 'sicuramente_si', 'nessuno',
     ARRAY['rapidita'], 'Lavoro impeccabile.', 'V1',
     now() - interval '296 days'),
    ('c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f', '6c5d4e3f-2a1b-4c9d-8e7f-5a4b3c2d1e0f',
     'riparazione perdita', '6_12_mesi',
     'si', 'si_con_variazioni_concordate', 'si', 'buona', 'ottima',
     'probabilmente_si', 'sicuramente_si', 'nessuno',
     ARRAY['correttezza', 'prezzo'], NULL, 'V2',
     now() - interval '333 days'),
    ('2b9c8d7e-6f50-4a3b-9c2d-1e0f9a8b7c6d', '6c5d4e3f-2a1b-4c9d-8e7f-5a4b3c2d1e0f',
     'manutenzione caldaia', '1_2_anni',
     'ritardo_accettabile', 'si', 'si', 'buona', 'buona',
     'probabilmente_si', 'probabilmente_si', 'risolti_con_difficolta',
     ARRAY['disponibilita'], NULL, 'V1',
     now() - interval '370 days'),
    ('3f6d1b8e-9c1a-4f2b-8d3e-1a2b3c4d5e6f', '6c5d4e3f-2a1b-4c9d-8e7f-5a4b3c2d1e0f',
     'riparazione scarico', 'oltre_2_anni',
     'si', 'si', 'si', 'buona', 'buona',
     'probabilmente_si', 'probabilmente_si', 'nessuno',
     ARRAY['prezzo'], NULL, 'V1',
     now() - interval '407 days');

-- Luca Bianchi: sotto soglia, resta "reputazione in costruzione".
INSERT INTO recensione (
    utente_id, professionista_id, categoria_servizio, periodo_utilizzo,
    puntualita, rispetto_prezzo, completamento, qualita, correttezza,
    richiamerebbe, consiglierebbe, problemi_successivi, motivi, commento, livello_verifica,
    creato_il
) VALUES
    ('c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f', '9b7a6c5d-4e3f-4a2b-8c1d-0e9f8a7b6c5d',
     'impianto luci', '1_2_anni',
     'si', 'si', 'si_dopo_correzione', 'buona', 'buona',
     'probabilmente_si', 'probabilmente_si', 'risolti_con_difficolta',
     ARRAY['prezzo'], NULL, 'V1',
     now() - interval '444 days'),
    ('2b9c8d7e-6f50-4a3b-9c2d-1e0f9a8b7c6d', '9b7a6c5d-4e3f-4a2b-8c1d-0e9f8a7b6c5d',
     'quadro elettrico', '3_6_mesi',
     'si', 'si', 'si', 'ottima', 'ottima',
     'sicuramente_si', 'sicuramente_si', 'nessuno',
     ARRAY['qualita'], NULL, 'V2',
     now() - interval '481 days');

-- Segnalazione senza esperienza personale (V0): nessuna risposta, nessun effetto sul punteggio.
INSERT INTO recensione (
    utente_id, professionista_id, categoria_servizio, periodo_utilizzo, livello_verifica
) VALUES
    ('8e7d6c5b-4a39-4b2c-9d1e-0f8a7b6c5d4e', '9b7a6c5d-4e3f-4a2b-8c1d-0e9f8a7b6c5d',
     'sopralluogo', 'ultimi_3_mesi', 'V0');

COMMIT;
