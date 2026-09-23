/**
 * Valori ammessi dal "Questionario di referenza Trust Score 1.0".
 * Sono gli stessi elencati nei CHECK della migrazione 001_init.sql:
 * modificando questi array va aggiornata anche una migrazione SQL.
 */

export const PERIODI_UTILIZZO = [
  'ultimi_3_mesi',
  '3_6_mesi',
  '6_12_mesi',
  '1_2_anni',
  'oltre_2_anni',
] as const;

export const PUNTUALITA = ['si', 'ritardo_accettabile', 'no', 'non_applicabile'] as const;

export const RISPETTO_PREZZO = [
  'si',
  'si_con_variazioni_concordate',
  'no',
  'prezzo_non_concordato',
  'non_applicabile',
] as const;

export const COMPLETAMENTO = ['si', 'si_dopo_correzione', 'no', 'non_valutabile'] as const;

export const GIUDIZI = ['ottima', 'buona', 'sufficiente', 'insoddisfacente'] as const;

export const INTENZIONI = [
  'sicuramente_si',
  'probabilmente_si',
  'probabilmente_no',
  'sicuramente_no',
] as const;

export const PROBLEMI_SUCCESSIVI = [
  'nessuno',
  'risolti_tempestivamente',
  'risolti_con_difficolta',
  'non_risolti',
  'non_valutabile',
] as const;

export const MOTIVI = [
  'qualita',
  'affidabilita',
  'puntualita',
  'prezzo',
  'disponibilita',
  'correttezza',
  'rapidita',
  'risoluzione_problema',
] as const;

export const MAX_MOTIVI = 2;

export const LIVELLI_VERIFICA = ['V0', 'V1', 'V2', 'V3'] as const;

export const STATI_RECENSIONE = ['pubblicata', 'esclusa'] as const;

/** Soglia di pubblicazione del punteggio (sezione 3 del documento Trust Score). */
export const SOGLIA_ESPERIENZE_VALIDE = 5;
export const SOGLIA_REFERENTI_DISTINTI = 3;

export type PeriodoUtilizzo = (typeof PERIODI_UTILIZZO)[number];
export type Puntualita = (typeof PUNTUALITA)[number];
export type RispettoPrezzo = (typeof RISPETTO_PREZZO)[number];
export type Completamento = (typeof COMPLETAMENTO)[number];
export type Giudizio = (typeof GIUDIZI)[number];
export type Intenzione = (typeof INTENZIONI)[number];
export type ProblemiSuccessivi = (typeof PROBLEMI_SUCCESSIVI)[number];
export type Motivo = (typeof MOTIVI)[number];
export type LivelloVerifica = (typeof LIVELLI_VERIFICA)[number];
export type StatoRecensione = (typeof STATI_RECENSIONE)[number];

/** Stato del documento allegato alla referenza (domanda 15). */
export const STATI_DOCUMENTO = ['assente', 'in_attesa', 'approvato', 'rifiutato'] as const;
export type StatoDocumento = (typeof STATI_DOCUMENTO)[number];

/** Metodi di conferma dell'esperienza e livello di verifica corrispondente. */
export const METODI_VERIFICA = {
  dichiarazione: 'V1',
  professionista: 'V2',
  documento: 'V2',
  piattaforma: 'V3',
} as const;

export type MetodoVerifica = keyof typeof METODI_VERIFICA;

/** Giorni di conservazione del documento caricato, oltre la verifica. */
export const GIORNI_CONSERVAZIONE_DOCUMENTO = 180;

/**
 * Domanda 2: tassonomia controllata dei servizi.
 * La descrizione libera del lavoro puo' integrarla, non sostituirla.
 */
export const CATEGORIE_SERVIZIO = [
  'idraulico',
  'elettricista',
  'fabbro',
  'muratore',
  'imbianchino',
  'giardiniere',
  'impresa_pulizie',
  'spurghista',
  'tecnico_caldaie',
  'disinfestatore',
  'tecnico_ascensorista',
] as const;

export type CategoriaServizio = (typeof CATEGORIE_SERVIZIO)[number];

export const MAX_DESCRIZIONE_LAVORO = 150;

/** Domanda 4: fascia indicativa dell'importo del lavoro (facoltativa). */
export const FASCE_IMPORTO = [
  'meno_100',
  '100_250',
  '251_500',
  '501_1000',
  '1001_5000',
  'oltre_5000',
] as const;

export type FasciaImporto = (typeof FASCE_IMPORTO)[number];

export const MAX_COMMENTO = 300;
