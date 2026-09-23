import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { CATEGORIE_SERVIZIO, VERIFICA_ETICHETTE } from '../../core/etichette';
import { CodaVerifiche, NuovoProfessionista, Professionista, Recensione, StatoDocumento } from '../../core/modelli';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin.component.html',
})
export class AdminComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly categorie = CATEGORIE_SERVIZIO;

  readonly stati: Array<{ valore: StatoDocumento; etichetta: string }> = [
    { valore: 'in_attesa', etichetta: 'Da verificare' },
    { valore: 'approvato', etichetta: 'Approvati' },
    { valore: 'rifiutato', etichetta: 'Rifiutati' },
  ];

  stato: StatoDocumento = 'in_attesa';
  coda: CodaVerifiche | null = null;
  caricamento = true;
  errore = '';
  conferma = '';

  /** Note di verifica in scrittura, per riga della coda. */
  note: Record<string, string> = {};
  inLavorazione: string | null = null;

  nuovo: NuovoProfessionista = { nome: '', categoria: '', telefono: '', quartiere: '', comune: '' };
  professionistiRecenti: Professionista[] = [];
  invioProfessionista = false;

  ngOnInit(): void {
    this.caricaCoda();
    this.caricaProfessionisti();
  }

  caricaCoda(): void {
    this.caricamento = true;
    this.api.verifiche(this.stato).subscribe({
      next: (coda) => {
        this.coda = coda;
        this.caricamento = false;
      },
      error: (risposta) => {
        this.caricamento = false;
        this.errore = risposta?.error?.message ?? 'Non riesco a caricare la coda di verifica.';
      },
    });
  }

  cambiaStato(stato: StatoDocumento): void {
    this.stato = stato;
    this.conferma = '';
    this.caricaCoda();
  }

  apriDocumento(recensione: Recensione): void {
    this.api.scaricaDocumento(recensione.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        // Il blob resta valido finche' la scheda non viene aperta.
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      },
      error: () => (this.errore = 'Documento non disponibile.'),
    });
  }

  approva(recensione: Recensione): void {
    this.inLavorazione = recensione.id;
    this.api.approvaDocumento(recensione.id, this.note[recensione.id]).subscribe({
      next: () => this.dopoEsito(`Documento approvato: la referenza passa a V2 verificata.`),
      error: (risposta) => this.erroreEsito(risposta),
    });
  }

  rifiuta(recensione: Recensione): void {
    this.inLavorazione = recensione.id;
    this.api.rifiutaDocumento(recensione.id, this.note[recensione.id]).subscribe({
      next: () => this.dopoEsito('Documento rifiutato: la referenza torna a V1 dichiarata.'),
      error: (risposta) => this.erroreEsito(risposta),
    });
  }

  creaProfessionista(): void {
    if (!this.nuovo.nome.trim() || !this.nuovo.categoria.trim()) {
      this.errore = 'Nome e categoria sono obbligatori.';
      return;
    }

    this.invioProfessionista = true;
    this.errore = '';

    const richiesta: NuovoProfessionista = {
      nome: this.nuovo.nome.trim(),
      categoria: this.nuovo.categoria,
      telefono: this.nuovo.telefono?.trim() || undefined,
      quartiere: this.nuovo.quartiere?.trim() || undefined,
      comune: this.nuovo.comune?.trim() || undefined,
    };

    this.api.creaProfessionista(richiesta).subscribe({
      next: (professionista) => {
        this.invioProfessionista = false;
        this.conferma = `${professionista.nome} inserito: la reputazione parte in costruzione.`;
        this.nuovo = { nome: '', categoria: '', telefono: '', quartiere: '', comune: '' };
        this.caricaProfessionisti();
      },
      error: (risposta) => {
        this.invioProfessionista = false;
        const messaggio = risposta?.error?.message;
        this.errore = Array.isArray(messaggio)
          ? messaggio.join(' · ')
          : messaggio ?? 'Inserimento non riuscito.';
      },
    });
  }

  etichettaCategoria(codice: string): string {
    return this.categorie.find((c) => c.valore === codice)?.etichetta ?? codice;
  }

  badge(livello: string): { testo: string; pill: string } {
    return VERIFICA_ETICHETTE[livello] ?? { testo: livello, pill: 'pill-neutral' };
  }

  dimensione(byte: number | null): string {
    if (!byte) return '';
    if (byte > 1024 * 1024) return `${(byte / (1024 * 1024)).toFixed(1)} MB`;
    if (byte >= 1024) return `${Math.round(byte / 1024)} KB`;
    return `${byte} byte`;
  }

  private caricaProfessionisti(): void {
    this.api.professionisti().subscribe({
      next: (elenco) =>
        (this.professionistiRecenti = [...elenco.risultati]
          .sort((a, b) => b.creatoIl.localeCompare(a.creatoIl))
          .slice(0, 5)),
      error: () => (this.professionistiRecenti = []),
    });
  }

  private dopoEsito(messaggio: string): void {
    this.inLavorazione = null;
    this.conferma = messaggio;
    this.caricaCoda();
  }

  private erroreEsito(risposta: any): void {
    this.inLavorazione = null;
    this.errore = risposta?.error?.message ?? 'Operazione non riuscita.';
  }
}
