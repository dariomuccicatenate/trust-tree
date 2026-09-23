import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Professionista } from '../professionisti/professionista.entity';
import { Recensione } from '../recensioni/recensione.entity';
import { Utente } from '../utenti/utente.entity';
import {
  COEFFICIENTE_PROSSIMITA,
  ComponenteTR,
  LivelloProssimita,
  PESI_TRUST_RELEVANCE,
  PESO_RANKING_TRUST_RELEVANCE,
  PESO_RANKING_TRUST_SCORE,
  SOGLIA_MINIMA_TRUST_SCORE,
  etichettaRelevance,
  valoreConferme,
} from './parametri';
import { TrustScoreService } from './trust-score.service';

export interface RisultatoTrustRelevance {
  professionistaId: string;
  utenteId: string;
  punteggio: number;
  etichetta: string;
  componenti: Record<ComponenteTR, number>;
  perLivello: Record<LivelloProssimita, number>;
  sommaPesiRelazionali: number;
  motivazioni: string[];
}

/**
 * Trust Relevance 1.0.
 *
 *   TR = 0,45P + 0,25C + 0,15I + 0,10M + 0,05G
 *
 * Il peso relazionale della singola referenza e'
 *
 *   Wᵢ = Dᵢ × Vᵢ × Rᵢ × Aᵢ
 *
 * (prossimita' × verifica × recenza × affidabilita' del referente) e la componente C si
 * ricava a fasce dalla somma S = ΣWᵢ.
 */
@Injectable()
export class TrustRelevanceService {
  constructor(
    @InjectRepository(Professionista)
    private readonly professionisti: Repository<Professionista>,
    @InjectRepository(Utente)
    private readonly utenti: Repository<Utente>,
    private readonly trustScore: TrustScoreService,
  ) {}

  async perProfessionista(
    professionistaId: string,
    utenteId: string,
    servizioCercato = '',
  ): Promise<RisultatoTrustRelevance> {
    const [professionista, utente] = await Promise.all([
      this.professionisti.findOne({ where: { id: professionistaId } }),
      this.utenti.findOne({ where: { id: utenteId } }),
    ]);

    if (!professionista) {
      throw new NotFoundException(`Professionista ${professionistaId} non trovato`);
    }
    if (!utente) {
      throw new NotFoundException(`Utente ${utenteId} non trovato`);
    }

    const recensioni = await this.trustScore
      .recensioniDi([professionistaId])
      .then((mappa) => mappa.get(professionistaId) ?? []);

    return this.calcola(recensioni, professionista, utente, servizioCercato);
  }

  calcola(
    recensioni: Recensione[],
    professionista: Professionista,
    utente: Utente,
    servizioCercato = '',
  ): RisultatoTrustRelevance {
    const valide = this.trustScore.esperienzeValide(recensioni);
    const perLivello: Record<LivelloProssimita, number> = { D1: 0, D2: 0, D3: 0, D4: 0, D5: 0 };

    if (valide.length === 0) {
      return {
        professionistaId: professionista.id,
        utenteId: utente.id,
        punteggio: 0,
        etichetta: etichettaRelevance(0),
        componenti: { P: 0, C: 0, I: 0, M: 0, G: 0 },
        perLivello,
        sommaPesiRelazionali: 0,
        motivazioni: ['Non risultano ancora referenze nella tua rete.'],
      };
    }

    const livelli = valide.map((r) => this.livelloProssimita(r.utente, utente));
    livelli.forEach((livello) => (perLivello[livello] += 1));

    // S = Σ Wᵢ = Σ (Dᵢ × Vᵢ × Rᵢ × Aᵢ)
    const sommaPesi = valide.reduce(
      (somma, r, i) =>
        somma + COEFFICIENTE_PROSSIMITA[livelli[i]] * this.trustScore.pesoReferenza(r),
      0,
    );

    const componenti: Record<ComponenteTR, number> = {
      P: this.valoreVicinanza(perLivello),
      C: valoreConferme(sommaPesi),
      I: this.valoreIndipendenza(valide),
      M: this.valoreServizio(valide, professionista, servizioCercato),
      G: this.valoreGeografia(professionista, utente, valide),
    };

    const punteggio = Math.round(
      (Object.keys(PESI_TRUST_RELEVANCE) as ComponenteTR[]).reduce(
        (somma, chiave) => somma + PESI_TRUST_RELEVANCE[chiave] * componenti[chiave],
        0,
      ),
    );

    return {
      professionistaId: professionista.id,
      utenteId: utente.id,
      punteggio,
      etichetta: etichettaRelevance(punteggio),
      componenti,
      perLivello,
      sommaPesiRelazionali: Number(sommaPesi.toFixed(2)),
      motivazioni: this.motivazioni(perLivello, componenti),
    };
  }

  /**
   * Livello di prossimita' tra referente e utente che cerca.
   * Con il modello dati attuale sono derivabili D2 (stesso condominio) e D5; D3 e D4
   * richiedono le comunita', oggi non presenti. Una referenza dell'utente stesso vale D1.
   */
  livelloProssimita(referente: Utente | undefined | null, utente: Utente): LivelloProssimita {
    if (!referente) return 'D5';
    if (referente.id === utente.id) return 'D1';
    if (utente.condominio && referente.condominio === utente.condominio) return 'D2';
    return 'D5';
  }

  /** Componente P: valorizza il livello piu' vicino effettivamente raggiunto (sezione 4.1). */
  private valoreVicinanza(perLivello: Record<LivelloProssimita, number>): number {
    if (perLivello.D1 >= 1) return 100;
    if (perLivello.D2 >= 2) return 95;
    if (perLivello.D2 === 1) return 85;
    if (perLivello.D3 >= 3) return 75;
    if (perLivello.D3 >= 1) return 60;
    if (perLivello.D4 >= 1) return 40;
    if (perLivello.D5 >= 1) return 15;
    return 0;
  }

  /** Componente I: indipendenza delle fonti (sezione 4.3). */
  private valoreIndipendenza(recensioni: Recensione[]): number {
    const referenti = new Set(recensioni.map((r) => r.utenteId));
    const comunita = new Set(recensioni.map((r) => r.utente?.condominio ?? 'nessuna'));

    if (referenti.size >= 5 && comunita.size >= 3) return 100;
    if (referenti.size >= 3 && comunita.size >= 2) return 80;
    if (referenti.size >= 2) return 60;
    if (referenti.size === 1) return 30;
    return 0;
  }

  /** Componente M: corrispondenza con il servizio cercato (sezione 4.4). */
  private valoreServizio(
    recensioni: Recensione[],
    professionista: Professionista,
    servizioCercato: string,
  ): number {
    const cercato = servizioCercato.trim().toLowerCase();
    if (!cercato) return 80;

    // Stessa attivita' e stesso tipo di intervento: la categoria della referenza coincide
    // con quella cercata (tassonomia controllata, oppure testo libero della ricerca).
    if (
      recensioni.some(
        (r) => r.categoriaServizio === cercato || r.categoriaServizio.includes(cercato),
      )
    ) {
      return 100;
    }
    // Stessa categoria professionale.
    if (professionista.categoria === cercato || professionista.categoria.includes(cercato)) {
      return 80;
    }
    // Categoria affine: per la versione 1.0 non abbiamo ancora una mappa delle affinita'.
    return 40;
  }

  /** Componente G: corrispondenza geografica (sezione 4.5). */
  private valoreGeografia(
    professionista: Professionista,
    utente: Utente,
    recensioni: Recensione[],
  ): number {
    if (
      utente.condominio &&
      recensioni.some((r) => r.utente?.condominio === utente.condominio)
    ) {
      return 100;
    }
    if (utente.quartiere && professionista.quartiere === utente.quartiere) return 80;
    if (utente.comune && professionista.comune === utente.comune) return 60;
    return 10;
  }

  /** Spiegazione deterministica del risultato (sezione 9), senza dati personali. */
  private motivazioni(
    perLivello: Record<LivelloProssimita, number>,
    componenti: Record<ComponenteTR, number>,
  ): string[] {
    const testi: string[] = [];

    if (perLivello.D1 >= 1) {
      testi.push('Hai già lasciato una referenza per questo professionista.');
    }
    if (perLivello.D2 >= 1) {
      const persone = perLivello.D2 === 1 ? '1 persona' : `${perLivello.D2} persone`;
      testi.push(`È stato utilizzato da ${persone} del tuo condominio.`);
    }
    if (perLivello.D3 >= 1 && perLivello.D2 === 0) {
      testi.push(`${perLivello.D3} persone della tua rete lo consigliano.`);
    }
    if (componenti.M >= 100) {
      testi.push('Le esperienze riguardano lo stesso tipo di intervento.');
    }
    if (testi.length === 0) {
      testi.push('Non risultano ancora referenze nella tua rete.');
    }

    return testi;
  }

  /**
   * Ordinamento: Ranking = 0,60 × Trust Score + 0,40 × Trust Relevance.
   * Sotto la soglia minima di Trust Score la prossimita' non puo' favorire il professionista.
   */
  ranking(trustScore: number, trustRelevance: number): number {
    if (trustScore < SOGLIA_MINIMA_TRUST_SCORE) {
      return trustScore;
    }
    return Math.round(
      PESO_RANKING_TRUST_SCORE * trustScore + PESO_RANKING_TRUST_RELEVANCE * trustRelevance,
    );
  }
}
