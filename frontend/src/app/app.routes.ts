import { Routes } from '@angular/router';
import { guardiaAdmin, guardiaAutenticato } from './core/guardie';

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
    canActivate: [guardiaAutenticato],
    loadComponent: () => import('./pagine/ricerca/ricerca.component').then((m) => m.RicercaComponent),
  },
  {
    path: 'professionisti/:id',
    title: 'Trust Tree — scheda professionista',
    canActivate: [guardiaAutenticato],
    loadComponent: () =>
      import('./pagine/dettaglio/dettaglio.component').then((m) => m.DettaglioComponent),
  },
  {
    path: 'professionisti/:id/referenza',
    title: 'Trust Tree — questionario di referenza',
    canActivate: [guardiaAutenticato],
    loadComponent: () =>
      import('./pagine/questionario/questionario.component').then((m) => m.QuestionarioComponent),
  },
  {
    path: 'admin',
    title: 'Trust Tree — amministrazione',
    canActivate: [guardiaAdmin],
    loadComponent: () => import('./pagine/admin/admin.component').then((m) => m.AdminComponent),
  },
  { path: '**', redirectTo: 'ricerca' },
];
