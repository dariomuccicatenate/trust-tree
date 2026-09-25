import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { ESEMPIO_CELLULARE, REGEX_CELLULARE, etichetta } from '../../core/etichette';
import { Professionista, Utente } from '../../core/modelli';

/**
 * Dati personali del professionista.
 *
 * Modificabili da lui: contatto pubblicato, zona e comune. Nome della scheda e
 * categoria no: sono i due dati su cui si e' formata la reputazione gia' raccolta,
 * e cambiarli a punteggio acquisito sposterebbe referenze da un soggetto o da un
 * servizio a un altro. Per quelli serve l'amministratore.
 */
@Component({
  selector: 'app-profilo-professionista',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profilo.component.html',
})
export class ProfiloProfessionistaComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  readonly esempioCellulare = ESEMPIO_CELLULARE;

  scheda: Professionista | null = null;
  utente: Utente | null = null;

  caricamento = true;
  invio = false;
  errore = '';
  conferma = '';

  telefono = '';
  quartiere = '';
  comune = '';

  ngOnInit(): void {
    this.utente = this.auth.utente;
    this.carica();
  }

  carica(): void {
    this.caricamento = true;
    this.api.schedaProfessionista().subscribe({
      next: (scheda) => {
        this.scheda = scheda;
        this.telefono = scheda.telefono ?? '';
        this.quartiere = scheda.quartiere ?? '';
        this.comune = scheda.comune ?? '';
        this.caricamento = false;
      },
      error: (risposta) => {
        this.caricamento = false;
        this.errore = this.messaggio(risposta, 'Non riesco a caricare i tuoi dati.');
      },
    });
  }

  salva(): void {
    const contatto = this.telefono.trim();
    if (contatto && !REGEX_CELLULARE.test(contatto)) {
      this.errore = `Il cellulare non sembra valido: usa un formato come ${ESEMPIO_CELLULARE}.`;
      this.conferma = '';
      return;
    }

    this.invio = true;
    this.errore = '';
    this.conferma = '';

    this.api
      .aggiornaSchedaProfessionista({
        telefono: contatto,
        quartiere: this.quartiere.trim(),
        comune: this.comune.trim(),
      })
      .subscribe({
        next: (scheda) => {
          this.invio = false;
          this.scheda = scheda;
          this.conferma = contatto
            ? 'Dati aggiornati: i tuoi clienti vedono subito il nuovo contatto.'
            : 'Dati aggiornati: il contatto non è più pubblicato sulla scheda.';
        },
        error: (risposta) => {
          this.invio = false;
          this.errore = this.messaggio(risposta, 'Modifica non salvata.');
        },
      });
  }

  annulla(): void {
    this.errore = '';
    this.conferma = '';
    if (this.scheda) {
      this.telefono = this.scheda.telefono ?? '';
      this.quartiere = this.scheda.quartiere ?? '';
      this.comune = this.scheda.comune ?? '';
    }
  }

  /** Vero se c'e' qualcosa da salvare: evita richieste inutili. */
  get modificato(): boolean {
    if (!this.scheda) {
      return false;
    }
    return (
      this.telefono.trim() !== (this.scheda.telefono ?? '') ||
      this.quartiere.trim() !== (this.scheda.quartiere ?? '') ||
      this.comune.trim() !== (this.scheda.comune ?? '')
    );
  }

  testo(valore: string | null | undefined): string {
    return etichetta(valore);
  }

  /** Zona come comparira' sulla scheda, con i valori in scrittura. */
  anteprimaZona(): string {
    return [this.quartiere.trim(), this.comune.trim()].filter(Boolean).join(' · ');
  }

  private messaggio(risposta: any, predefinito: string): string {
    const messaggio = risposta?.error?.message;
    return Array.isArray(messaggio) ? messaggio.join(' · ') : messaggio ?? predefinito;
  }
}
