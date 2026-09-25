import { Routes } from '@angular/router';
import { guardiaAdmin, guardiaProfessionista, guardiaRicerca } from './core/guardie';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'ricerca' },
  {
    path: 'login',
    title: 'Accedi o registrati — Trust Tree, referenze verificate di professionisti',
    loadComponent: () => import('./pagine/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'ricerca',
    title: 'Trust Tree — ricerca',
    canActivate: [guardiaRicerca],
    loadComponent: () => import('./pagine/ricerca/ricerca.component').then((m) => m.RicercaComponent),
  },
  {
    path: 'professionisti/:id',
    title: 'Trust Tree — scheda professionista',
    canActivate: [guardiaRicerca],
    loadComponent: () =>
      import('./pagine/dettaglio/dettaglio.component').then((m) => m.DettaglioComponent),
  },
  {
    path: 'professionisti/:id/referenza',
    title: 'Trust Tree — questionario di referenza',
    canActivate: [guardiaRicerca],
    loadComponent: () =>
      import('./pagine/questionario/questionario.component').then((m) => m.QuestionarioComponent),
  },
  {
    path: 'area-professionista',
    title: 'Trust Tree — le mie referenze',
    canActivate: [guardiaProfessionista],
    loadComponent: () =>
      import('./pagine/professionista/professionista.component').then(
        (m) => m.ProfessionistaComponent,
      ),
  },
  {
    path: 'area-professionista/profilo',
    title: 'Trust Tree — i miei dati',
    canActivate: [guardiaProfessionista],
    loadComponent: () =>
      import('./pagine/professionista/profilo.component').then(
        (m) => m.ProfiloProfessionistaComponent,
      ),
  },
  {
    path: 'admin',
    title: 'Trust Tree — amministrazione',
    canActivate: [guardiaAdmin],
    loadComponent: () => import('./pagine/admin/admin.component').then((m) => m.AdminComponent),
  },
  { path: '**', redirectTo: 'ricerca' },
];
