import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, debounceTime } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { CATEGORIE_SERVIZIO, Opzione } from '../../core/etichette';
import { RisultatoRicerca } from '../../core/modelli';

@Component({
  selector: 'app-ricerca',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './ricerca.component.html',
})
export class RicercaComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly cambiFiltri = new Subject<void>();

  testo = '';
  categoria = '';
  zona = '';

  /** Tassonomia predefinita dei servizi. */
  readonly categorie: Opzione[] = CATEGORIE_SERVIZIO;
  zone: string[] = [];

  pubblicati: RisultatoRicerca[] = [];
  inCostruzione: RisultatoRicerca[] = [];
  totale = 0;
  caricamento = true;
  errore = '';

  ngOnInit(): void {
    this.api.professionisti().subscribe({
      next: (elenco) => {
        this.zone = [
          ...new Set(
            elenco.risultati.flatMap((p) => [p.quartiere, p.comune].filter(Boolean) as string[]),
          ),
        ].sort();
      },
      error: () => undefined,
    });

    // I punteggi arrivano dall'API: ogni filtro e' una nuova ricerca, con un piccolo ritardo.
    this.cambiFiltri.pipe(debounceTime(250)).subscribe(() => this.cerca());
    this.cerca();
  }

  filtriCambiati(): void {
    this.cambiFiltri.next();
  }

  cerca(): void {
    this.caricamento = true;
    this.api
      .ricerca({
        testo: this.testo.trim() || undefined,
        categoria: this.categoria || undefined,
        zona: this.zona || undefined,
      })
      .subscribe({
        next: (esito) => {
          this.pubblicati = esito.pubblicati;
          this.inCostruzione = esito.inCostruzione;
          this.totale = esito.totale;
          this.caricamento = false;
          this.errore = '';
        },
        error: (risposta) => {
          this.caricamento = false;
          this.errore = risposta?.error?.message ?? 'Ricerca non riuscita.';
        },
      });
  }

  etichettaCategoria(codice: string): string {
    return this.categorie.find((c) => c.valore === codice)?.etichetta ?? codice;
  }

  descrizione(risultato: RisultatoRicerca): string {
    const p = risultato.professionista;
    const zona = [p.quartiere, p.comune].filter(Boolean).join(', ');
    return [zona, this.etichettaCategoria(p.categoria)].filter(Boolean).join(' · ');
  }
}
