import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { Registrazione, RispostaLogin } from '../../core/modelli';

type Scheda = 'accesso' | 'registrazione';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {
  private readonly meta = inject(Meta);
  private readonly titolo = inject(Title);

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly rotta = inject(ActivatedRoute);

  scheda: Scheda = 'accesso';

  /**
   * Su schermo stretto le due meta' diventano due schermate: prima la presentazione,
   * poi il form. Su desktop restano affiancate e questo stato non ha effetto.
   */
  mostraForm = false;
  invio = false;
  errore = '';

  email = '';
  password = '';

  nuovo: Registrazione & { conferma: string } = {
    email: '',
    password: '',
    conferma: '',
    nome: '',
    cognome: '',
    condominio: '',
    quartiere: '',
    comune: '',
  };

  ngOnInit(): void {
    // Descrizione e anteprime social della pagina pubblica.
    const descrizione =
      'Trova idraulici, elettricisti e imprese edili con referenze verificate di chi li ha ' +
      'davvero usati: Trust Score sull’affidabilità e Trust Relevance sulle referenze del tuo ' +
      'condominio. Accedi o registrati su Trust Tree.';

    this.titolo.setTitle('Accedi o registrati — Trust Tree, referenze verificate di professionisti');
    this.meta.updateTag({ name: 'description', content: descrizione });
    this.meta.updateTag({
      name: 'keywords',
      content:
        'referenze verificate, professionisti di fiducia, idraulico, elettricista, impresa edile, condominio, passaparola, Trust Score',
    });
    this.meta.updateTag({ property: 'og:title', content: 'Trust Tree — referenze verificate di professionisti' });
    this.meta.updateTag({ property: 'og:description', content: descrizione });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
  }

  apriForm(scheda: Scheda = 'accesso'): void {
    this.scheda = scheda;
    this.errore = '';
    this.mostraForm = true;
  }

  tornaAllaPresentazione(): void {
    this.mostraForm = false;
  }

  cambiaScheda(scheda: Scheda): void {
    this.scheda = scheda;
    this.errore = '';
  }

  accedi(): void {
    if (!this.email.trim() || !this.password) {
      this.errore = 'Inserisci email e password.';
      return;
    }
    this.esegui(this.auth.login(this.email.trim(), this.password));
  }

  registrati(): void {
    const mancante = this.validaRegistrazione();
    if (mancante) {
      this.errore = mancante;
      return;
    }

    this.esegui(
      this.auth.registrati({
        email: this.nuovo.email.trim(),
        password: this.nuovo.password,
        nome: this.nuovo.nome.trim(),
        cognome: this.nuovo.cognome.trim(),
        condominio: this.nuovo.condominio?.trim() || undefined,
        quartiere: this.nuovo.quartiere?.trim() || undefined,
        comune: this.nuovo.comune?.trim() || undefined,
      }),
    );
  }

  /** Scorciatoia per il prototipo: l'utenza di prova entra con un solo clic. */
  provaAccount(email: string, password: string): void {
    this.scheda = 'accesso';
    this.email = email;
    this.password = password;
    this.accedi();
  }

  private validaRegistrazione(): string | null {
    if (!this.nuovo.nome.trim() || !this.nuovo.cognome.trim()) return 'Inserisci nome e cognome.';
    if (!this.nuovo.email.trim()) return 'Inserisci una email.';
    if (this.nuovo.password.length < 8) return 'La password deve avere almeno 8 caratteri.';
    if (this.nuovo.password !== this.nuovo.conferma) return 'Le due password non coincidono.';
    return null;
  }

  /** Accesso e registrazione finiscono entrambi con l'utente autenticato. */
  private esegui(richiesta: Observable<RispostaLogin>): void {
    this.invio = true;
    this.errore = '';

    richiesta.subscribe({
      next: (risposta) => {
        this.invio = false;
        const ritorno = this.rotta.snapshot.queryParamMap.get('ritorno');
        const predefinita = risposta.utente.ruolo === 'admin' ? '/admin' : '/ricerca';
        this.router.navigateByUrl(ritorno ?? predefinita);
      },
      error: (risposta) => {
        this.invio = false;
        const messaggio = risposta?.error?.message;
        this.errore = Array.isArray(messaggio)
          ? messaggio.join(' · ')
          : messaggio ?? 'Operazione non riuscita.';
      },
    });
  }
}
