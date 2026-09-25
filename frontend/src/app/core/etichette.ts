/**
 * Testi delle opzioni del questionario 1.0.
 * I codici coincidono con i valori accettati dall'API (e dai CHECK del database):
 * qui vivono solo le etichette mostrate all'utente.
 */

export interface Opzione {
  valore: string;
  etichetta: string;
}

/** Domanda 2: tassonomia controllata dei servizi (stessa lista dell'API). */
export const CATEGORIE_SERVIZIO: Opzione[] = [
  { valore: 'idraulico', etichetta: 'Idraulico' },
  { valore: 'elettricista', etichetta: 'Elettricista' },
  { valore: 'fabbro', etichetta: 'Fabbro' },
  { valore: 'muratore', etichetta: 'Muratore' },
  { valore: 'imbianchino', etichetta: 'Imbianchino' },
  { valore: 'giardiniere', etichetta: 'Giardiniere' },
  { valore: 'impresa_pulizie', etichetta: 'Impresa di pulizie' },
  { valore: 'spurghista', etichetta: 'Spurghista' },
  { valore: 'tecnico_caldaie', etichetta: 'Tecnico caldaie' },
  { valore: 'disinfestatore', etichetta: 'Disinfestatore' },
  { valore: 'tecnico_ascensorista', etichetta: 'Tecnico ascensorista' },
];

/** Domanda 4: fascia indicativa dell'importo del lavoro (facoltativa). */
export const FASCE_IMPORTO: Opzione[] = [
  { valore: 'meno_100', etichetta: 'Meno di 100 €' },
  { valore: '100_250', etichetta: '100 - 250 €' },
  { valore: '251_500', etichetta: '251 - 500 €' },
  { valore: '501_1000', etichetta: '501 - 1.000 €' },
  { valore: '1001_5000', etichetta: '1.001 - 5.000 €' },
  { valore: 'oltre_5000', etichetta: 'Oltre 5.000 €' },
];

export const PERIODO_UTILIZZO: Opzione[] = [
  { valore: 'ultimi_3_mesi', etichetta: 'Negli ultimi 3 mesi' },
  { valore: '3_6_mesi', etichetta: 'Da 3 a 6 mesi fa' },
  { valore: '6_12_mesi', etichetta: 'Da 6 a 12 mesi fa' },
  { valore: '1_2_anni', etichetta: 'Da 1 a 2 anni fa' },
  { valore: 'oltre_2_anni', etichetta: 'Oltre 2 anni fa' },
];

export const PUNTUALITA: Opzione[] = [
  { valore: 'si', etichetta: 'Sì' },
  { valore: 'ritardo_accettabile', etichetta: 'Con un ritardo accettabile' },
  { valore: 'no', etichetta: 'No' },
  { valore: 'non_applicabile', etichetta: 'Non applicabile' },
];

export const RISPETTO_PREZZO: Opzione[] = [
  { valore: 'si', etichetta: 'Sì' },
  { valore: 'si_con_variazioni_concordate', etichetta: 'Sì, salvo variazioni concordate' },
  { valore: 'no', etichetta: 'No' },
  { valore: 'prezzo_non_concordato', etichetta: 'Non era stato concordato un prezzo' },
  { valore: 'non_applicabile', etichetta: 'Non applicabile' },
];

export const COMPLETAMENTO: Opzione[] = [
  { valore: 'si', etichetta: 'Sì' },
  { valore: 'si_dopo_correzione', etichetta: 'Sì, dopo un intervento correttivo' },
  { valore: 'no', etichetta: 'No' },
  { valore: 'non_valutabile', etichetta: 'Non sono ancora in grado di valutarlo' },
];

export const GIUDIZI: Opzione[] = [
  { valore: 'ottima', etichetta: 'Ottima' },
  { valore: 'buona', etichetta: 'Buona' },
  { valore: 'sufficiente', etichetta: 'Sufficiente' },
  { valore: 'insoddisfacente', etichetta: 'Insoddisfacente' },
];

export const INTENZIONI: Opzione[] = [
  { valore: 'sicuramente_si', etichetta: 'Sicuramente sì' },
  { valore: 'probabilmente_si', etichetta: 'Probabilmente sì' },
  { valore: 'probabilmente_no', etichetta: 'Probabilmente no' },
  { valore: 'sicuramente_no', etichetta: 'Sicuramente no' },
];

export const PROBLEMI_SUCCESSIVI: Opzione[] = [
  { valore: 'nessuno', etichetta: 'No' },
  { valore: 'risolti_tempestivamente', etichetta: 'Sì, risolti tempestivamente' },
  { valore: 'risolti_con_difficolta', etichetta: 'Sì, risolti con difficoltà' },
  { valore: 'non_risolti', etichetta: 'Sì, non risolti' },
  { valore: 'non_valutabile', etichetta: 'Non posso ancora valutarlo' },
];

export const MOTIVI: Opzione[] = [
  { valore: 'qualita', etichetta: 'Qualità del lavoro' },
  { valore: 'affidabilita', etichetta: 'Affidabilità' },
  { valore: 'puntualita', etichetta: 'Puntualità' },
  { valore: 'prezzo', etichetta: 'Prezzo' },
  { valore: 'disponibilita', etichetta: 'Disponibilità' },
  { valore: 'correttezza', etichetta: 'Correttezza' },
  { valore: 'rapidita', etichetta: 'Rapidità' },
  { valore: 'risoluzione_problema', etichetta: 'Capacità di risolvere il problema' },
];

/** Domanda 15: il metodo di conferma determina il livello di verifica. */
export const METODI_VERIFICA: Array<Opzione & { livello: 'V1' | 'V2' | 'V3' }> = [
  { valore: 'dichiarazione', etichetta: 'Conferma mediante dichiarazione personale', livello: 'V1' },
  { valore: 'professionista', etichetta: 'Conferma del professionista', livello: 'V2' },
  {
    valore: 'documento',
    etichetta: 'Caricamento di preventivo, fattura, ricevuta o altra prova',
    livello: 'V2',
  },
  {
    valore: 'piattaforma',
    etichetta: 'Intervento gestito attraverso la piattaforma',
    livello: 'V3',
  },
];

export const VERIFICA_ETICHETTE: Record<string, { testo: string; pill: string }> = {
  V0: { testo: 'V0 · segnalazione', pill: 'pill-neutral' },
  V1: { testo: 'V1 · dichiarata', pill: 'pill-neutral' },
  V2: { testo: 'V2 · verificata', pill: 'pill-good' },
  V3: { testo: 'V3 · transazione in piattaforma', pill: 'pill-good' },
};

function mappa(opzioni: Opzione[]): Record<string, string> {
  return opzioni.reduce<Record<string, string>>((acc, o) => {
    acc[o.valore] = o.etichetta;
    return acc;
  }, {});
}

const TUTTE = {
  ...mappa(CATEGORIE_SERVIZIO),
  ...mappa(FASCE_IMPORTO),
  ...mappa(PERIODO_UTILIZZO),
  ...mappa(GIUDIZI),
  ...mappa(INTENZIONI),
  ...mappa(MOTIVI),
};

export function etichetta(valore: string | null | undefined): string {
  if (!valore) {
    return '—';
  }
  return TUTTE[valore] ?? valore;
}

/** Numero di cellulare italiano: stessa regola dell'API. */
export const REGEX_CELLULARE = /^(?:(?:\+|00)39[\s.-]?)?3\d{2}[\s.-]?\d{3}[\s.-]?\d{3,4}$/;

export const ESEMPIO_CELLULARE = '+39 333 1234567';

/** Motivi con cui un professionista puo' chiedere la contestazione di una referenza. */
export const MOTIVI_CONTESTAZIONE: Opzione[] = [
  { valore: 'mai_incaricato', etichetta: 'Non ho mai lavorato per questa persona' },
  { valore: 'lavoro_non_mio', etichetta: 'Il lavoro descritto non è mio' },
  { valore: 'dati_errati', etichetta: 'I dati del lavoro non sono corretti' },
  { valore: 'contenuto_offensivo', etichetta: 'Il commento è offensivo o diffamatorio' },
  { valore: 'dati_personali', etichetta: 'Il commento contiene dati personali' },
  { valore: 'altro', etichetta: 'Altro motivo' },
];

export const STATI_CONTESTAZIONE_ETICHETTE: Record<string, { testo: string; pill: string }> = {
  nessuna: { testo: 'nessuna richiesta', pill: 'pill-neutral' },
  aperta: { testo: 'richiesta in esame', pill: 'pill-warn' },
  accolta: { testo: 'richiesta accolta · referenza esclusa', pill: 'pill-good' },
  respinta: { testo: 'richiesta respinta', pill: 'pill-neutral' },
};

export function etichettaMotivoContestazione(valore: string | null | undefined): string {
  if (!valore) {
    return '—';
  }
  return MOTIVI_CONTESTAZIONE.find((m) => m.valore === valore)?.etichetta ?? valore;
}
