import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CodaVerifiche,
  Elenco,
  EsitoRicerca,
  NuovaRecensione,
  NuovoProfessionista,
  Registrazione,
  Professionista,
  Recensione,
  Riepilogo,
  RispostaLogin,
  StatoDocumento,
  TrustRelevance,
  TrustScore,
  Utente,
} from './modelli';

/** Client dell'API NestJS (cartella ../api). Il prefisso /api passa dal proxy. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api';

  // --- autenticazione ---

  login(email: string, password: string): Observable<RispostaLogin> {
    return this.http.post<RispostaLogin>(`${this.base}/auth/login`, { email, password });
  }

  registrazione(dati: Registrazione): Observable<RispostaLogin> {
    return this.http.post<RispostaLogin>(`${this.base}/auth/registrazione`, dati);
  }

  me(): Observable<Utente> {
    return this.http.get<Utente>(`${this.base}/auth/me`);
  }

  // --- ricerca e punteggi ---

  ricerca(filtri: { testo?: string; categoria?: string; zona?: string }): Observable<EsitoRicerca> {
    let parametri = new HttpParams();
    if (filtri.testo) parametri = parametri.set('testo', filtri.testo);
    if (filtri.categoria) parametri = parametri.set('categoria', filtri.categoria);
    if (filtri.zona) parametri = parametri.set('zona', filtri.zona);

    return this.http.get<EsitoRicerca>(`${this.base}/ricerca`, { params: parametri });
  }

  trustScore(professionistaId: string): Observable<TrustScore> {
    return this.http.get<TrustScore>(`${this.base}/professionisti/${professionistaId}/trust-score`);
  }

  trustRelevance(professionistaId: string, servizio?: string): Observable<TrustRelevance> {
    let parametri = new HttpParams();
    if (servizio) parametri = parametri.set('servizio', servizio);

    return this.http.get<TrustRelevance>(
      `${this.base}/professionisti/${professionistaId}/trust-relevance`,
      { params: parametri },
    );
  }

  // --- professionisti ---

  professionisti(limit = 100): Observable<Elenco<Professionista>> {
    return this.http.get<Elenco<Professionista>>(`${this.base}/professionisti`, {
      params: new HttpParams().set('limit', limit),
    });
  }

  professionista(id: string): Observable<Professionista> {
    return this.http.get<Professionista>(`${this.base}/professionisti/${id}`);
  }

  creaProfessionista(professionista: NuovoProfessionista): Observable<Professionista> {
    return this.http.post<Professionista>(`${this.base}/professionisti`, professionista);
  }

  /** Solo l'amministratore: l'API rifiuta la chiamata agli altri ruoli. */
  aggiornaProfessionista(
    id: string,
    dati: Partial<NuovoProfessionista>,
  ): Observable<Professionista> {
    return this.http.patch<Professionista>(`${this.base}/professionisti/${id}`, dati);
  }

  riepilogo(id: string): Observable<Riepilogo> {
    return this.http.get<Riepilogo>(`${this.base}/professionisti/${id}/riepilogo`);
  }

  // --- recensioni ---

  recensioniDi(professionistaId: string, limit = 100): Observable<Elenco<Recensione>> {
    return this.http.get<Elenco<Recensione>>(
      `${this.base}/professionisti/${professionistaId}/recensioni`,
      { params: new HttpParams().set('limit', limit) },
    );
  }

  creaRecensione(recensione: NuovaRecensione): Observable<Recensione> {
    return this.http.post<Recensione>(`${this.base}/recensioni`, recensione);
  }

  allegaDocumento(recensioneId: string, file: File): Observable<Recensione> {
    const corpo = new FormData();
    corpo.append('documento', file);
    return this.http.post<Recensione>(`${this.base}/recensioni/${recensioneId}/documento`, corpo);
  }

  // --- area amministrativa ---

  verifiche(stato: StatoDocumento = 'in_attesa'): Observable<CodaVerifiche> {
    return this.http.get<CodaVerifiche>(`${this.base}/admin/verifiche`, {
      params: new HttpParams().set('stato', stato),
    });
  }

  urlDocumento(recensioneId: string): string {
    return `${this.base}/admin/verifiche/${recensioneId}/documento`;
  }

  scaricaDocumento(recensioneId: string): Observable<Blob> {
    return this.http.get(this.urlDocumento(recensioneId), { responseType: 'blob' });
  }

  approvaDocumento(recensioneId: string, note?: string): Observable<Recensione> {
    return this.http.post<Recensione>(`${this.base}/admin/verifiche/${recensioneId}/approva`, {
      note,
    });
  }

  rifiutaDocumento(recensioneId: string, note?: string): Observable<Recensione> {
    return this.http.post<Recensione>(`${this.base}/admin/verifiche/${recensioneId}/rifiuta`, {
      note,
    });
  }
}
