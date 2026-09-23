import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Rotte riservate agli utenti autenticati. */
export const guardiaAutenticato: CanActivateFn = (_rotta, stato) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.autenticato) {
    return true;
  }
  return router.createUrlTree(['/login'], { queryParams: { ritorno: stato.url } });
};

/** Rotte riservate agli amministratori. */
export const guardiaAdmin: CanActivateFn = (rotta, stato) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.autenticato) {
    return router.createUrlTree(['/login'], { queryParams: { ritorno: stato.url } });
  }
  return auth.admin ? true : router.createUrlTree(['/ricerca']);
};
