import { Injectable } from '@angular/core';
import { Utente } from './modelli';

const CHIAVE_TOKEN = 'trust-tree.token';
const CHIAVE_UTENTE = 'trust-tree.utente';

/**
 * Custodia del token.
 *
 * Il valore vive prima di tutto in memoria: se il browser blocca il localStorage
 * (navigazione privata, cookie di terze parti disattivati, criteri aziendali) la sessione
 * resta comunque valida fino alla chiusura della scheda, invece di far rimbalzare
 * l'utente al login subito dopo un accesso riuscito.
 *
 * Servizio senza dipendenze: cosi' possono usarlo sia AuthService sia l'interceptor HTTP,
 * senza creare un ciclo con HttpClient.
 */
@Injectable({ providedIn: 'root' })
export class TokenStore {
  private token: string | null = null;
  private utente: Utente | null = null;

  constructor() {
    this.token = this.leggi(CHIAVE_TOKEN);
    const salvato = this.leggi(CHIAVE_UTENTE);
    this.utente = salvato ? this.interpreta(salvato) : null;
  }

  leggiToken(): string | null {
    return this.token;
  }

  leggiUtente(): Utente | null {
    return this.utente;
  }

  salva(token: string, utente: Utente): void {
    this.token = token;
    this.utente = utente;
    this.scrivi(CHIAVE_TOKEN, token);
    this.scrivi(CHIAVE_UTENTE, JSON.stringify(utente));
  }

  pulisci(): void {
    this.token = null;
    this.utente = null;
    try {
      localStorage.removeItem(CHIAVE_TOKEN);
      localStorage.removeItem(CHIAVE_UTENTE);
    } catch {
      // storage non disponibile: basta aver svuotato la memoria
    }
  }

  private leggi(chiave: string): string | null {
    try {
      return localStorage.getItem(chiave);
    } catch {
      return null;
    }
  }

  private scrivi(chiave: string, valore: string): void {
    try {
      localStorage.setItem(chiave, valore);
    } catch {
      // sessione valida solo finche' la scheda resta aperta
    }
  }

  private interpreta(salvato: string): Utente | null {
    try {
      return JSON.parse(salvato) as Utente;
    } catch {
      // formato vecchio (solo l'id): si riparte dal profilo chiesto all'API
      return null;
    }
  }
}
