/**
 * Pesi, coefficienti e fasce dei documenti "Trust Score 1.0" e "Trust Relevance 1.0".
 *
 * Sono raccolti in un unico file perche' la versione 1.0 e' esplicitamente sperimentale:
 * pesi e soglie vanno ricalibrati dopo il primo campione significativo, senza modificare
 * retroattivamente le risposte gia' raccolte.
 */

/** Pesi delle componenti del Trust Score (sezione 3). */
export const PESI_TRUST_SCORE = {
  C: 0.25, // consiglio personale
  R: 0.2, // disponibilita' a richiamarlo
  Q: 0.15, // qualita' del lavoro
  E: 0.15, // esito del lavoro e problemi successivi
  P: 0.1, // rispetto degli accordi economici
  A: 0.05, // puntualita' e affidabilita'
  PR: 0.05, // correttezza e professionalita'
  V: 0.05, // solidita' delle referenze
} as const;

export type ComponenteTS = keyof typeof PESI_TRUST_SCORE;

/** Pesi delle componenti della Trust Relevance (sezione 3). */
export const PESI_TRUST_RELEVANCE = {
  P: 0.45, // vicinanza delle referenze
  C: 0.25, // numero di conferme rilevanti
  I: 0.15, // indipendenza delle fonti
  M: 0.1, // corrispondenza con il servizio cercato
  G: 0.05, // corrispondenza geografica
} as const;

export type ComponenteTR = keyof typeof PESI_TRUST_RELEVANCE;

/** Conversione delle risposte in valori 0-100 (sezione 4). */
export const VALORI_INTENZIONE: Record<string, number> = {
  sicuramente_si: 100,
  probabilmente_si: 75,
  probabilmente_no: 25,
  sicuramente_no: 0,
};

export const VALORI_GIUDIZIO: Record<string, number> = {
  ottima: 100,
  buona: 80,
  sufficiente: 50,
  insoddisfacente: 0,
};

export const VALORI_PUNTUALITA: Record<string, number> = {
  si: 100,
  ritardo_accettabile: 70,
  no: 0,
};

export const VALORI_PREZZO: Record<string, number> = {
  si: 100,
  si_con_variazioni_concordate: 90,
  no: 0,
};

export const VALORI_COMPLETAMENTO: Record<string, number> = {
  si: 100,
  si_dopo_correzione: 70,
  no: 0,
};

export const VALORI_PROBLEMI: Record<string, number> = {
  nessuno: 100,
  risolti_tempestivamente: 85,
  risolti_con_difficolta: 40,
  non_risolti: 0,
};

/** Coefficiente di verifica (sezione 5). V0 non genera reputazione. */
export const COEFFICIENTE_VERIFICA: Record<string, number> = {
  V1: 0.7,
  V2: 0.9,
  V3: 1.0,
};

/** Coefficiente di recenza, ricavato dal periodo di utilizzo dichiarato (sezione 5). */
export const COEFFICIENTE_RECENZA: Record<string, number> = {
  ultimi_3_mesi: 1.0,
  '3_6_mesi': 1.0,
  '6_12_mesi': 0.95,
  '1_2_anni': 0.85,
  oltre_2_anni: 0.7,
};

/** Coefficienti di prossimita' relazionale (Trust Relevance, sezione 1). */
export const COEFFICIENTE_PROSSIMITA = {
  D1: 1.0,
  D2: 0.9,
  D3: 0.65,
  D4: 0.4,
  D5: 0.15,
} as const;

export type LivelloProssimita = keyof typeof COEFFICIENTE_PROSSIMITA;

/** Soglia di pubblicazione del Trust Score (sezione 3). */
export const SOGLIA_ESPERIENZE_VALIDE = 5;
export const SOGLIA_REFERENTI_DISTINTI = 3;

/** Solidita' del campione (sezione 7). */
export function solidita(esperienze: number): string {
  if (esperienze < SOGLIA_ESPERIENZE_VALIDE) return 'Reputazione in costruzione';
  if (esperienze < 15) return 'Solidità iniziale';
  if (esperienze < 30) return 'Buona solidità';
  if (esperienze < 75) return 'Alta solidità';
  return 'Solidità molto alta';
}

/** Componente V: numerosita' delle esperienze valide (sezione 6). */
export function valoreV(esperienze: number): number {
  if (esperienze < 15) return 50;
  if (esperienze < 30) return 70;
  if (esperienze < 75) return 90;
  return 100;
}

/** Correttivo di indipendenza sulla componente V (sezione 6). */
export const CONCENTRAZIONE_MASSIMA = 0.6;
export const FINESTRA_CONCENTRAZIONE_GIORNI = 30;
export const PENALITA_INDIPENDENZA = 15;

/** Componente C della Trust Relevance: fasce sulla somma dei pesi relazionali (sezione 4.2). */
export function valoreConferme(sommaPesi: number): number {
  if (sommaPesi < 0.5) return 10;
  if (sommaPesi < 1.0) return 25;
  if (sommaPesi < 2.0) return 50;
  if (sommaPesi < 3.5) return 70;
  if (sommaPesi < 6.0) return 85;
  return 100;
}

/** Etichetta pubblica della Trust Relevance (sezione 5). */
export function etichettaRelevance(tr: number): string {
  if (tr >= 85) return 'Molto rilevante per te';
  if (tr >= 70) return 'Rilevante per te';
  if (tr >= 50) return 'Moderatamente rilevante';
  if (tr >= 30) return 'Poco rilevante per te';
  return 'Nessun collegamento significativo';
}

/**
 * Ordinamento dei risultati (sezione 7 di Trust Relevance).
 * La soglia di salvaguardia e' un parametro ancora da validare: il documento cita 80 come
 * esempio esplicitamente non confermato, qui e' tenuta bassa per non nascondere i profili
 * nuovi durante il pilota.
 */
export const PESO_RANKING_TRUST_SCORE = 0.6;
export const PESO_RANKING_TRUST_RELEVANCE = 0.4;
export const SOGLIA_MINIMA_TRUST_SCORE = 40;
