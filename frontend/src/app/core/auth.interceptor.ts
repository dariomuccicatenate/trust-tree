import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { TokenStore } from './token.store';

/** Aggiunge il bearer token e, su 401, riporta al login. */
export const authInterceptor: HttpInterceptorFn = (richiesta, avanti) => {
  const router = inject(Router);
  const store = inject(TokenStore);

  const token = store.leggiToken();

  const inoltrata = token
    ? richiesta.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : richiesta;

  return avanti(inoltrata).pipe(
    catchError((errore: HttpErrorResponse) => {
      if (errore.status === 401 && !richiesta.url.includes('/auth/')) {
        store.pulisci();
        router.navigate(['/login']);
      }
      return throwError(() => errore);
    }),
  );
};
