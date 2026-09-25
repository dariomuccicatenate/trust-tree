/** Modelli allineati alle risposte dell'API (cartella ../api). */

export interface Utente {
  id: string;
  email: string;
  nome: string;
  cognome: string;
  condominio: string | null;
  quartiere: string | null;
  comune: string | null;
  ruolo: Ruolo;
  creatoIl: string;
}

export interface Professionista {
  id: string;
  nome: string;
  categoria: string;
  telefono: string | null;
  quartiere: string | null;
  comune: string | null;
  /** Account che governa la scheda: vuoto se non e' stata rivendicata. */
  utenteId: string | null;
  creatoIl: string;
}

export type LivelloVerifica = 'V0' | 'V1' | 'V2' | 'V3';
export type StatoRecensione = 'pubblicata' | 'esclusa';

export interface Recensione {
  id: string;
  utenteId: string;
  professionistaId: string;
  categoriaServizio: string;
  descrizioneLavoro: string | null;
  periodoUtilizzo: string;
  fasciaImporto: string | null;
  puntualita: string | null;
  rispettoPrezzo: string | null;
  completamento: string | null;
  qualita: string | null;
  correttezza: string | null;
  richiamerebbe: string | null;
  consiglierebbe: string | null;
  problemiSuccessivi: string | null;
  motivi: string[];
  commento: string | null;
  livelloVerifica: LivelloVerifica;
  stato: StatoRecensione;
  creatoIl: string;

  documentoNome: string | null;
  documentoMime: string | null;
  documentoDimensione: number | null;
  documentoCaricatoIl: string | null;
  documentoStato: StatoDocumento;
  documentoConservazioneFinoAl: string | null;
  verificatoDa: string | null;
  verificatoIl: string | null;
  noteVerifica: string | null;

  contestazioneStato: StatoContestazione;
  contestazioneMotivo: MotivoContestazione | null;
  contestazioneDettaglio: string | null;
  contestazioneApertaIl: string | null;
  contestazioneApertaDa: string | null;
  contestazioneDecisaIl: string | null;
  contestazioneDecisaDa: string | null;
  contestazioneNoteEsito: string | null;

  utente?: Utente;
  professionista?: Professionista;
}

export interface NuovaRecensione {
  professionistaId: string;
  categoriaServizio: string;
  descrizioneLavoro?: string;
  periodoUtilizzo: string;
  fasciaImporto?: string;
  puntualita?: string;
  rispettoPrezzo?: string;
  completamento?: string;
  qualita?: string;
  correttezza?: string;
  richiamerebbe?: string;
  consiglierebbe?: string;
  problemiSuccessivi?: string;
  motivi?: string[];
  commento?: string;
  livelloVerifica?: LivelloVerifica;
}

export interface Riepilogo {
  professionistaId: string;
  esperienzeValide: number;
  referentiDistinti: number;
  segnalazioni: number;
  reputazioneInCostruzione: boolean;
  perLivelloVerifica: Record<string, number>;
  consiglierebbe: Record<string, number>;
  richiamerebbe: Record<string, number>;
  qualita: Record<string, number>;
  motiviPrincipali: string[];
}

export interface Elenco<T> {
  totale: number;
  risultati: T[];
}

// --- autenticazione ---

export type Ruolo = 'utente' | 'admin' | 'professionista';

export interface Registrazione {
  email: string;
  password: string;
  nome: string;
  cognome: string;
  condominio?: string;
  quartiere?: string;
  comune?: string;
}

/** Registrazione di un professionista: crea l'account e, insieme, la sua scheda. */
export interface RegistrazioneProfessionista {
  email: string;
  password: string;
  nome: string;
  cognome: string;
  nomeAttivita?: string;
  categoria: string;
  telefono?: string;
  quartiere?: string;
  comune?: string;
}

export interface RispostaLogin {
  accessToken: string;
  utente: Utente;
  professionista?: Professionista;
}

// --- punteggi calcolati dall'API ---

export type ComponenteTS = 'C' | 'R' | 'Q' | 'E' | 'P' | 'A' | 'PR' | 'V';
export type ComponenteTR = 'P' | 'C' | 'I' | 'M' | 'G';
export type LivelloProssimita = 'D1' | 'D2' | 'D3' | 'D4' | 'D5';

export interface TrustScore {
  professionistaId: string;
  pubblicato: boolean;
  punteggio: number | null;
  solidita: string;
  esperienzeValide: number;
  referentiDistinti: number;
  fontiConcentrate: boolean;
  componenti: Partial<Record<ComponenteTS, number>>;
  pesiApplicati: Partial<Record<ComponenteTS, number>>;
}

export interface TrustRelevance {
  professionistaId: string;
  utenteId: string;
  punteggio: number;
  etichetta: string;
  componenti: Record<ComponenteTR, number>;
  perLivello: Record<LivelloProssimita, number>;
  sommaPesiRelazionali: number;
  motivazioni: string[];
}

export interface RisultatoRicerca {
  professionista: Professionista;
  trustScore: TrustScore;
  trustRelevance: TrustRelevance | null;
  ranking: number | null;
}

export interface EsitoRicerca {
  totale: number;
  pubblicati: RisultatoRicerca[];
  inCostruzione: RisultatoRicerca[];
}

// --- verifica documentale ---

export type StatoDocumento = 'assente' | 'in_attesa' | 'approvato' | 'rifiutato';

export interface CodaVerifiche {
  totale: number;
  conteggi: Record<StatoDocumento, number>;
  risultati: Recensione[];
}

export interface NuovoProfessionista {
  nome: string;
  categoria: string;
  telefono?: string;
  quartiere?: string;
  comune?: string;
}

// --- area del professionista e contestazioni ---

export type StatoContestazione = 'nessuna' | 'aperta' | 'accolta' | 'respinta';

export type MotivoContestazione =
  | 'mai_incaricato'
  | 'lavoro_non_mio'
  | 'contenuto_offensivo'
  | 'dati_errati'
  | 'dati_personali'
  | 'altro';

/**
 * Referenza come la vede il professionista: senza l'identita' di chi l'ha scritta.
 * L'API non la espone affatto, non e' un campo nascosto nell'interfaccia.
 */
export interface ReferenzaRicevuta {
  id: string;
  categoriaServizio: string;
  descrizioneLavoro: string | null;
  periodoUtilizzo: string;
  fasciaImporto: string | null;
  puntualita: string | null;
  rispettoPrezzo: string | null;
  completamento: string | null;
  qualita: string | null;
  correttezza: string | null;
  richiamerebbe: string | null;
  consiglierebbe: string | null;
  problemiSuccessivi: string | null;
  motivi: string[];
  commento: string | null;
  livelloVerifica: LivelloVerifica;
  stato: StatoRecensione;
  creatoIl: string;
  contestazioneStato: StatoContestazione;
  contestazioneMotivo: MotivoContestazione | null;
  contestazioneDettaglio: string | null;
  contestazioneApertaIl: string | null;
  contestazioneDecisaIl: string | null;
  contestazioneNoteEsito: string | null;
  concorreAiPunteggi: boolean;
}

export interface CruscottoProfessionista {
  professionista: Professionista;
  riepilogo: Riepilogo;
  trustScore: TrustScore;
  referenze: ReferenzaRicevuta[];
  contestazioni: Record<StatoContestazione, number>;
}

export interface NuovaContestazione {
  recensioneId: string;
  motivo: MotivoContestazione;
  dettaglio?: string;
}

export interface CodaContestazioni {
  totale: number;
  conteggi: Record<StatoContestazione, number>;
  risultati: Recensione[];
}

/** Dati della scheda che il professionista puo' cambiare da solo. */
export interface AggiornaScheda {
  telefono?: string;
  quartiere?: string;
  comune?: string;
}
