import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { Registrazione, RegistrazioneProfessionista, RispostaLogin, Utente } from './modelli';
import { TokenStore } from './token.store';

/** Sessione dell'utente autenticato: token JWT in localStorage e profilo in memoria. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly store = inject(TokenStore);
  private readonly corrente = new BehaviorSubject<Utente | null>(this.store.leggiUtente());

  readonly utente$: Observable<Utente | null> = this.corrente.asObservable();

  get utente(): Utente | null {
    return this.corrente.value;
  }

  get autenticato(): boolean {
    return !!this.token;
  }

  get admin(): boolean {
    return this.corrente.value?.ruolo === 'admin';
  }

  get professionista(): boolean {
    return this.corrente.value?.ruolo === 'professionista';
  }

  /** Pagina iniziale del ruolo: ognuno entra dove ha qualcosa da fare. */
  get paginaIniziale(): string {
    if (this.admin) return '/admin';
    if (this.professionista) return '/area-professionista';
    return '/ricerca';
  }

  get token(): string | null {
    return this.store.leggiToken();
  }

  login(email: string, password: string): Observable<RispostaLogin> {
    return this.api.login(email, password).pipe(
      tap((risposta) => {
        this.salva(risposta.accessToken, risposta.utente);
        this.corrente.next(risposta.utente);
      }),
    );
  }

  registrati(dati: Registrazione): Observable<RispostaLogin> {
    return this.api.registrazione(dati).pipe(
      tap((risposta) => {
        this.salva(risposta.accessToken, risposta.utente);
        this.corrente.next(risposta.utente);
      }),
    );
  }

  /** Registrazione come professionista: il ruolo si stabilisce qui, non e' poi modificabile. */
  registratiComeProfessionista(dati: RegistrazioneProfessionista): Observable<RispostaLogin> {
    return this.api.registrazioneProfessionista(dati).pipe(
      tap((risposta) => {
        this.salva(risposta.accessToken, risposta.utente);
        this.corrente.next(risposta.utente);
      }),
    );
  }

  esci(): void {
    this.store.pulisci();
    this.corrente.next(null);
    this.router.navigate(['/login']);
  }

  /** Riallinea il profilo con l'API: se il token non e' piu' valido riporta al login. */
  aggiornaProfilo(): void {
    if (!this.token) {
      return;
    }
    this.api.me().subscribe({
      next: (utente) => {
        this.salva(this.token as string, utente);
        this.corrente.next(utente);
      },
      error: () => this.esci(),
    });
  }

  private salva(token: string, utente: Utente): void {
    this.store.salva(token, utente);
  }
}
