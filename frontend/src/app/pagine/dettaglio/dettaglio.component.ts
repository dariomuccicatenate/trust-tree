import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, of, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { ESEMPIO_CELLULARE, REGEX_CELLULARE, VERIFICA_ETICHETTE, etichetta } from '../../core/etichette';
import {
  ComponenteTR,
  ComponenteTS,
  Professionista,
  Recensione,
  Riepilogo,
  TrustRelevance,
  TrustScore,
  Utente,
} from '../../core/modelli';

@Component({
  selector: 'app-dettaglio',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dettaglio.component.html',
})
export class DettaglioComponent implements OnInit {
  private readonly rotta = inject(ActivatedRoute);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  professionista: Professionista | null = null;
  utente: Utente | null = null;
  riepilogo: Riepilogo | null = null;
  trustScore: TrustScore | null = null;
  trustRelevance: TrustRelevance | null = null;

  valide: Recensione[] = [];
  escluse: Recensione[] = [];
  segnalazioni: Recensione[] = [];

  caricamento = true;
  errore = '';

  // --- contatto del professionista: modificabile solo dall'amministratore ---
  modificaContatto = false;
  contatto = '';
  salvataggioContatto = false;
  esitoContatto = '';

  readonly componentiTS: Array<{ chiave: ComponenteTS; nome: string }> = [
    { chiave: 'C', nome: 'Consiglio' },
    { chiave: 'R', nome: 'Richiamerebbe' },
    { chiave: 'Q', nome: 'Qualità' },
    { chiave: 'E', nome: 'Esito lavoro' },
    { chiave: 'P', nome: 'Accordi economici' },
    { chiave: 'A', nome: 'Puntualità' },
    { chiave: 'PR', nome: 'Professionalità' },
    { chiave: 'V', nome: 'Solidità referenze' },
  ];

  readonly componentiTR: Array<{ chiave: ComponenteTR; nome: string }> = [
    { chiave: 'P', nome: 'Vicinanza (P)' },
    { chiave: 'C', nome: 'Conferme (C)' },
    { chiave: 'I', nome: 'Indipendenza (I)' },
    { chiave: 'M', nome: 'Servizio (M)' },
    { chiave: 'G', nome: 'Geografia (G)' },
  ];

  ngOnInit(): void {
    this.auth.utente$.subscribe((utente) => (this.utente = utente));

    this.rotta.paramMap
      .pipe(
        switchMap((parametri) => {
          const id = parametri.get('id') ?? '';
          return forkJoin({
            professionista: this.api.professionista(id),
            trustScore: this.api.trustScore(id),
            trustRelevance: this.api.trustRelevance(id).pipe(catchError(() => of(null))),
            recensioni: this.api.recensioniDi(id),
            riepilogo: this.api.riepilogo(id).pipe(catchError(() => of(null))),
          });
        }),
      )
      .subscribe({
        next: (dati) => {
          this.professionista = dati.professionista;
          this.contatto = dati.professionista.telefono ?? '';
          this.trustScore = dati.trustScore;
          this.trustRelevance = dati.trustScore.pubblicato ? dati.trustRelevance : null;
          this.riepilogo = dati.riepilogo;

          const recensioni = dati.recensioni.risultati;
          this.valide = recensioni.filter(
            (r) => r.stato === 'pubblicata' && r.livelloVerifica !== 'V0',
          );
          this.escluse = recensioni.filter((r) => r.stato === 'esclusa');
          this.segnalazioni = recensioni.filter((r) => r.livelloVerifica === 'V0');

          this.caricamento = false;
        },
        error: (risposta) => {
          this.caricamento = false;
          this.errore = risposta?.error?.message ?? 'Non riesco a caricare la scheda.';
        },
      });
  }

  get admin(): boolean {
    return this.auth.admin;
  }

  apriModificaContatto(): void {
    this.contatto = this.professionista?.telefono ?? '';
    this.esitoContatto = '';
    this.modificaContatto = true;
  }

  salvaContatto(): void {
    if (!this.professionista) return;

    const contatto = this.contatto.trim();
    if (contatto && !REGEX_CELLULARE.test(contatto)) {
      this.esitoContatto = `Numero di cellulare non valido, es. ${ESEMPIO_CELLULARE}.`;
      return;
    }

    this.salvataggioContatto = true;
    this.esitoContatto = '';

    this.api
      .aggiornaProfessionista(this.professionista.id, { telefono: this.contatto.trim() })
      .subscribe({
        next: (professionista) => {
          this.professionista = professionista;
          this.contatto = professionista.telefono ?? '';
          this.salvataggioContatto = false;
          this.modificaContatto = false;
          this.esitoContatto = 'Contatto aggiornato.';
        },
        error: (risposta) => {
          this.salvataggioContatto = false;
          const messaggio = risposta?.error?.message;
          this.esitoContatto = Array.isArray(messaggio)
            ? messaggio.join(' · ')
            : messaggio ?? 'Aggiornamento non riuscito.';
        },
      });
  }

  annullaContatto(): void {
    this.modificaContatto = false;
    this.contatto = this.professionista?.telefono ?? '';
    this.esitoContatto = '';
  }

  percentuale(campo: 'richiamerebbe' | 'consiglierebbe'): number {
    if (!this.valide.length) return 0;
    const positive = this.valide.filter(
      (r) => r[campo] === 'sicuramente_si' || r[campo] === 'probabilmente_si',
    ).length;
    return Math.round((positive / this.valide.length) * 100);
  }

  conteggioVerifica(livello: string): number {
    return this.valide.filter((r) => r.livelloVerifica === livello).length;
  }

  provenienza(recensione: Recensione): string {
    const utente = recensione.utente;
    if (utente?.condominio) return `Residente, ${utente.condominio}`;
    if (utente?.quartiere) return `Utente della zona ${utente.quartiere}`;
    return 'Utente verificato della piattaforma';
  }

  badgeVerifica(livello: string): { testo: string; pill: string } {
    return VERIFICA_ETICHETTE[livello] ?? { testo: livello, pill: 'pill-neutral' };
  }

  testo(valore: string | null): string {
    return etichetta(valore);
  }

  valoreTS(chiave: ComponenteTS): number | undefined {
    return this.trustScore?.componenti[chiave];
  }

  valoreTR(chiave: ComponenteTR): number | undefined {
    return this.trustRelevance?.componenti[chiave];
  }

  zonaProfessionista(): string {
    const pr = this.professionista;
    if (!pr) return '';
    return [pr.quartiere, pr.comune].filter(Boolean).join(', ');
  }

  motiviPrincipali(): string[] {
    return (this.riepilogo?.motiviPrincipali ?? []).map((m) => etichetta(m));
  }

  larghezza(valore: number | undefined): string {
    return `${Math.max(0, Math.min(100, valore ?? 0))}%`;
  }

  arrotonda(valore: number | undefined): string {
    return valore === undefined ? '—' : String(Math.round(valore));
  }
}
