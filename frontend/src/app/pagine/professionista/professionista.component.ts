import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import {
  MOTIVI_CONTESTAZIONE,
  STATI_CONTESTAZIONE_ETICHETTE,
  VERIFICA_ETICHETTE,
  etichetta,
  etichettaMotivoContestazione,
} from '../../core/etichette';
import { CruscottoProfessionista, MotivoContestazione, ReferenzaRicevuta } from '../../core/modelli';

/**
 * Area del professionista: rivede le referenze ricevute e, se ne ritiene una impropria,
 * chiede all'amministratore di contestarla.
 *
 * Le referenze arrivano dall'API senza l'identita' degli autori: non c'e' nulla da
 * nascondere nel template, il dato non viene trasmesso.
 */
@Component({
  selector: 'app-professionista',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './professionista.component.html',
})
export class ProfessionistaComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly motivi = MOTIVI_CONTESTAZIONE;

  cruscotto: CruscottoProfessionista | null = null;
  caricamento = true;
  errore = '';
  conferma = '';

  /** Referenza per cui e' aperto il modulo di contestazione. */
  moduloPer: string | null = null;
  motivo: MotivoContestazione | '' = '';
  dettaglio = '';
  invio = false;

  ngOnInit(): void {
    this.carica();
  }

  carica(): void {
    this.caricamento = true;
    this.api.cruscottoProfessionista().subscribe({
      next: (cruscotto) => {
        this.cruscotto = cruscotto;
        this.caricamento = false;
      },
      error: (risposta) => {
        this.caricamento = false;
        this.errore = this.messaggio(risposta, 'Non riesco a caricare le tue referenze.');
      },
    });
  }

  apriModulo(referenza: ReferenzaRicevuta): void {
    this.moduloPer = referenza.id;
    this.motivo = '';
    this.dettaglio = '';
    this.errore = '';
    this.conferma = '';
  }

  chiudiModulo(): void {
    this.moduloPer = null;
    this.motivo = '';
    this.dettaglio = '';
  }

  invia(referenza: ReferenzaRicevuta): void {
    if (!this.motivo) {
      this.errore = 'Scegli il motivo della richiesta.';
      return;
    }
    const dettaglio = this.dettaglio.trim();
    if (dettaglio && dettaglio.length < 10) {
      this.errore = 'La spiegazione, se la scrivi, deve avere almeno 10 caratteri.';
      return;
    }

    this.invio = true;
    this.errore = '';

    this.api
      .contestaReferenza({
        recensioneId: referenza.id,
        motivo: this.motivo,
        dettaglio: dettaglio || undefined,
      })
      .subscribe({
        next: () => {
          this.invio = false;
          this.chiudiModulo();
          this.conferma =
            'Richiesta inviata: la esamina un amministratore. Fino alla decisione la referenza resta pubblicata.';
          this.carica();
        },
        error: (risposta) => {
          this.invio = false;
          this.errore = this.messaggio(risposta, 'Richiesta non inviata.');
        },
      });
  }

  /** Una referenza si contesta una volta sola: dopo la decisione la richiesta e' chiusa. */
  contestabile(referenza: ReferenzaRicevuta): boolean {
    return referenza.contestazioneStato === 'nessuna';
  }

  testo(valore: string | null | undefined): string {
    return etichetta(valore);
  }

  motivoContestazione(valore: string | null | undefined): string {
    return etichettaMotivoContestazione(valore);
  }

  badge(livello: string): { testo: string; pill: string } {
    return VERIFICA_ETICHETTE[livello] ?? { testo: livello, pill: 'pill-neutral' };
  }

  badgeContestazione(stato: string): { testo: string; pill: string } {
    return STATI_CONTESTAZIONE_ETICHETTE[stato] ?? { testo: stato, pill: 'pill-neutral' };
  }

  zona(): string {
    const scheda = this.cruscotto?.professionista;
    if (!scheda) {
      return '';
    }
    return [scheda.quartiere, scheda.comune].filter(Boolean).join(' · ');
  }

  private messaggio(risposta: any, predefinito: string): string {
    const messaggio = risposta?.error?.message;
    return Array.isArray(messaggio) ? messaggio.join(' · ') : messaggio ?? predefinito;
  }
}
