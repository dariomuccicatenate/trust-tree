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
  return auth.admin ? true : router.createUrlTree([auth.paginaIniziale]);
};

/**
 * Ricerca, scheda e questionario: sono di chi cerca un professionista.
 * Un account di tipo professionista non ci passa: la sua pagina sono le referenze
 * ricevute. L'amministratore invece conserva l'accesso, gli serve per i controlli.
 */
export const guardiaRicerca: CanActivateFn = (_rotta, stato) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.autenticato) {
    return router.createUrlTree(['/login'], { queryParams: { ritorno: stato.url } });
  }
  return auth.professionista ? router.createUrlTree(['/area-professionista']) : true;
};

/** Rotte riservate agli account di tipo professionista. */
export const guardiaProfessionista: CanActivateFn = (_rotta, stato) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.autenticato) {
    return router.createUrlTree(['/login'], { queryParams: { ritorno: stato.url } });
  }
  return auth.professionista ? true : router.createUrlTree([auth.paginaIniziale]);
};
