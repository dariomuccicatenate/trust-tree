import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import {
  CATEGORIE_SERVIZIO,
  COMPLETAMENTO,
  FASCE_IMPORTO,
  GIUDIZI,
  INTENZIONI,
  METODI_VERIFICA,
  MOTIVI,
  Opzione,
  PERIODO_UTILIZZO,
  PROBLEMI_SUCCESSIVI,
  PUNTUALITA,
  RISPETTO_PREZZO,
} from '../../core/etichette';
import { NuovaRecensione, Professionista, Recensione, TrustScore, Utente } from '../../core/modelli';

/**
 * Questionario di referenza 1.0.
 * Un passo per sezione del documento: A identificazione del servizio, B valutazione oggettiva,
 * C domande determinanti, D referenza qualitativa, E verifica dell'esperienza.
 */
type Passo = 'gate' | 'servizio' | 'valutazione' | 'determinanti' | 'qualitativa' | 'verifica' | 'fine';

const PASSI_REFERENZA: Passo[] = [
  'gate',
  'servizio',
  'valutazione',
  'determinanti',
  'qualitativa',
  'verifica',
  'fine',
];

/** Senza esperienza personale il questionario si ferma: resta solo una segnalazione. */
const PASSI_SEGNALAZIONE: Passo[] = ['gate', 'servizio', 'fine'];

const SEZIONI: Record<Passo, { codice: string; titolo: string } | null> = {
  gate: { codice: 'A', titolo: 'Identificazione del servizio' },
  servizio: { codice: 'A', titolo: 'Identificazione del servizio' },
  valutazione: { codice: 'B', titolo: 'Valutazione oggettiva' },
  determinanti: { codice: 'C', titolo: 'Domande determinanti' },
  qualitativa: { codice: 'D', titolo: 'Referenza qualitativa' },
  verifica: { codice: 'E', titolo: "Verifica dell'esperienza" },
  fine: null,
};

@Component({
  selector: 'app-questionario',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './questionario.component.html',
})
export class QuestionarioComponent implements OnInit {
  private readonly rotta = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  readonly categorie = CATEGORIE_SERVIZIO;
  readonly fasceImporto = FASCE_IMPORTO;
  readonly periodi = PERIODO_UTILIZZO;
  readonly puntualita = PUNTUALITA;
  readonly prezzi = RISPETTO_PREZZO;
  readonly completamenti = COMPLETAMENTO;
  readonly giudizi = GIUDIZI;
  readonly intenzioni = INTENZIONI;
  readonly problemi = PROBLEMI_SUCCESSIVI;
  readonly motiviDisponibili = MOTIVI;
  readonly metodiVerifica = METODI_VERIFICA;

  /** Tabella dei livelli di verifica, come nel documento. */
  readonly livelli = [
    {
      codice: 'V0',
      nome: 'Segnalazione',
      definizione: 'nessuna esperienza personale dichiarata',
      effetto: 'non genera reputazione',
    },
    {
      codice: 'V1',
      nome: 'Referenza',
      definizione: 'utente identificato che dichiara esperienza personale',
      effetto: 'coefficiente 0,70',
    },
    {
      codice: 'V2',
      nome: 'Referenza verificata',
      definizione: 'conferma reciproca o prova documentale',
      effetto: 'coefficiente 0,90',
    },
    {
      codice: 'V3',
      nome: 'Transazione verificata',
      definizione: 'richiesta e intervento transitati nella piattaforma',
      effetto: 'coefficiente 1,00',
    },
  ];

  professionista: Professionista | null = null;
  utente: Utente | null = null;

  indice = 0;
  /** Domanda 1: fa da filtro per tutto il resto del questionario. */
  utilizzoPersonale: 'si' | 'no' | null = null;
  invio = false;
  errore = '';
  trustScoreAggiornato: TrustScore | null = null;

  /** Documento allegato quando la conferma avviene con preventivo, fattura o ricevuta. */
  documento: File | null = null;
  esitoDocumento = '';

  dati = {
    categoriaServizio: '',
    descrizioneLavoro: '',
    periodoUtilizzo: '',
    fasciaImporto: '',
    puntualita: '',
    rispettoPrezzo: '',
    completamento: '',
    qualita: '',
    correttezza: '',
    richiamerebbe: '',
    consiglierebbe: '',
    problemiSuccessivi: '',
    motivi: [] as string[],
    commento: '',
    metodoVerifica: '',
  };

  ngOnInit(): void {
    this.auth.utente$.subscribe((utente) => (this.utente = utente));

    this.rotta.paramMap
      .pipe(switchMap((parametri) => this.api.professionista(parametri.get('id') ?? '')))
      .subscribe({
        next: (professionista) => {
          this.professionista = professionista;
          // La categoria del professionista e' la scelta piu' probabile, resta modificabile.
          if (!this.dati.categoriaServizio) {
            this.dati.categoriaServizio = professionista.categoria;
          }
        },
        error: () => (this.errore = 'Professionista non trovato.'),
      });
  }

  get passi(): Passo[] {
    return this.utilizzoPersonale === 'no' ? PASSI_SEGNALAZIONE : PASSI_REFERENZA;
  }

  get passo(): Passo {
    return this.passi[Math.min(this.indice, this.passi.length - 1)];
  }

  get sezione(): { codice: string; titolo: string } | null {
    return SEZIONI[this.passo];
  }

  get segnalazione(): boolean {
    return this.utilizzoPersonale === 'no';
  }

  get ultimoPrimaDellInvio(): boolean {
    return this.indice === this.passi.length - 2;
  }

  get caratteriCommento(): number {
    return this.dati.commento.length;
  }

  selezionaMotivo(valore: string): void {
    if (this.dati.motivi.includes(valore)) {
      this.dati.motivi = this.dati.motivi.filter((m) => m !== valore);
    } else if (this.dati.motivi.length < 2) {
      this.dati.motivi = [...this.dati.motivi, valore];
    }
  }

  motivoSelezionato(valore: string): boolean {
    return this.dati.motivi.includes(valore);
  }

  motivoDisabilitato(valore: string): boolean {
    return !this.motivoSelezionato(valore) && this.dati.motivi.length >= 2;
  }

  selezionaDocumento(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    this.documento = input.files?.length ? input.files[0] : null;
  }

  indietro(): void {
    this.errore = '';
    this.indice = Math.max(0, this.indice - 1);
  }

  avanti(): void {
    const mancante = this.validaPasso();
    if (mancante) {
      this.errore = mancante;
      return;
    }

    this.errore = '';

    if (this.ultimoPrimaDellInvio) {
      this.invia();
      return;
    }

    this.indice = Math.min(this.passi.length - 1, this.indice + 1);
  }

  /**
   * Obbligatorie solo le domande che il documento indica come tali: 1, 2, 3, 8, 10, 11 e 15.
   * Le risposte non date o «non applicabile» sono escluse dal calcolo, senza penalizzazioni.
   */
  private validaPasso(): string | null {
    switch (this.passo) {
      case 'gate':
        return this.utilizzoPersonale
          ? null
          : 'Indica se hai utilizzato personalmente il professionista (domanda 1).';
      case 'servizio':
        if (!this.dati.categoriaServizio) return 'Scegli la categoria del servizio (domanda 2).';
        if (!this.dati.periodoUtilizzo) return 'Indica quando lo hai utilizzato (domanda 3).';
        return null;
      case 'valutazione':
        return this.dati.qualita ? null : 'La qualità del lavoro è obbligatoria (domanda 8).';
      case 'determinanti':
        if (!this.dati.richiamerebbe) return 'Indica se lo richiameresti (domanda 10).';
        if (!this.dati.consiglierebbe) {
          return 'Indica se lo consiglieresti: è la domanda principale (domanda 11).';
        }
        return null;
      case 'verifica':
        return this.dati.metodoVerifica
          ? null
          : 'Indica come puoi confermare l’utilizzo (domanda 15).';
      default:
        return null;
    }
  }

  private invia(): void {
    if (!this.professionista || !this.utente) {
      this.errore = 'Sessione non valida: accedi di nuovo.';
      return;
    }

    const metodo = this.metodiVerifica.find((m) => m.valore === this.dati.metodoVerifica);

    // Domanda 1 negativa: si registra solo la segnalazione, senza risposte e senza reputazione.
    const payload: NuovaRecensione = this.segnalazione
      ? {
          professionistaId: this.professionista.id,
          categoriaServizio: this.dati.categoriaServizio,
          descrizioneLavoro: this.dati.descrizioneLavoro.trim() || undefined,
          periodoUtilizzo: this.dati.periodoUtilizzo,
          livelloVerifica: 'V0',
        }
      : {
          professionistaId: this.professionista.id,
          categoriaServizio: this.dati.categoriaServizio,
          descrizioneLavoro: this.dati.descrizioneLavoro.trim() || undefined,
          periodoUtilizzo: this.dati.periodoUtilizzo,
          fasciaImporto: this.dati.fasciaImporto || undefined,
          puntualita: this.dati.puntualita || undefined,
          rispettoPrezzo: this.dati.rispettoPrezzo || undefined,
          completamento: this.dati.completamento || undefined,
          qualita: this.dati.qualita,
          correttezza: this.dati.correttezza || undefined,
          richiamerebbe: this.dati.richiamerebbe,
          consiglierebbe: this.dati.consiglierebbe,
          problemiSuccessivi: this.dati.problemiSuccessivi || undefined,
          motivi: this.dati.motivi.length ? this.dati.motivi : undefined,
          commento: this.dati.commento.trim() || undefined,
          livelloVerifica: metodo?.livello ?? 'V1',
        };

    this.invio = true;
    this.api.creaRecensione(payload).subscribe({
      next: (recensione) => {
        this.invio = false;
        this.indice = this.passi.length - 1;
        this.caricaDocumento(recensione);
        this.aggiornaPunteggio();
      },
      error: (risposta) => {
        this.invio = false;
        const messaggio = risposta?.error?.message;
        this.errore = Array.isArray(messaggio)
          ? messaggio.join(' · ')
          : messaggio ?? 'Invio non riuscito.';
      },
    });
  }

  /** Il documento va in coda di verifica: l'amministratore decide se portare la referenza a V2. */
  private caricaDocumento(recensione: Recensione): void {
    if (!this.documento || this.dati.metodoVerifica !== 'documento') {
      return;
    }

    this.api.allegaDocumento(recensione.id, this.documento).subscribe({
      next: () =>
        (this.esitoDocumento =
          'Documento caricato: resta privato e va in verifica presso l’amministratore.'),
      error: (risposta) =>
        (this.esitoDocumento =
          risposta?.error?.message ?? 'Documento non caricato: puoi riprovare dalla scheda.'),
    });
  }

  private aggiornaPunteggio(): void {
    if (!this.professionista) return;
    this.api.trustScore(this.professionista.id).subscribe({
      next: (punteggio) => (this.trustScoreAggiornato = punteggio),
      error: () => (this.trustScoreAggiornato = null),
    });
  }

  vaiAllaScheda(): void {
    if (this.professionista) {
      this.router.navigate(['/professionisti', this.professionista.id]);
    }
  }

  etichettaAvanti(): string {
    if (this.invio) return 'Invio in corso…';
    if (!this.ultimoPrimaDellInvio) return 'Continua';
    return this.segnalazione ? 'Registra segnalazione' : 'Invia referenza';
  }

  opzioniMotivi(): Opzione[] {
    return this.motiviDisponibili;
  }
}
