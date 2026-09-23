import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from './core/auth.service';
import { Utente } from './core/modelli';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  utente: Utente | null = null;
  infoAperta = false;

  /** Sulla pagina di accesso la barra mostra solo nome e logo, centrati. */
  suLogin = false;

  ngOnInit(): void {
    this.suLogin = this.router.url.startsWith('/login');
    this.router.events
      .pipe(filter((evento): evento is NavigationEnd => evento instanceof NavigationEnd))
      .subscribe((evento) => (this.suLogin = evento.urlAfterRedirects.startsWith('/login')));

    this.auth.utente$.subscribe((utente) => (this.utente = utente));
    this.auth.aggiornaProfilo();
  }

  zona(utente: Utente): string {
    return [utente.condominio, utente.quartiere, utente.comune].filter(Boolean).join(' · ');
  }

  esci(): void {
    this.auth.esci();
  }
}
