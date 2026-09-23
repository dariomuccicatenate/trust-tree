import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Professionista } from '../professionisti/professionista.entity';
import { Utente } from '../utenti/utente.entity';
import { RisultatoTrustRelevance, TrustRelevanceService } from './trust-relevance.service';
import { RisultatoTrustScore, TrustScoreService } from './trust-score.service';

export interface RisultatoRicerca {
  professionista: Professionista;
  trustScore: RisultatoTrustScore;
  trustRelevance: RisultatoTrustRelevance | null;
  ranking: number | null;
}

export interface EsitoRicerca {
  totale: number;
  pubblicati: RisultatoRicerca[];
  inCostruzione: RisultatoRicerca[];
}

/** Ricerca dei professionisti con punteggi e ordinamento calcolati lato server. */
@Injectable()
export class RicercaService {
  constructor(
    @InjectRepository(Professionista)
    private readonly professionisti: Repository<Professionista>,
    @InjectRepository(Utente)
    private readonly utenti: Repository<Utente>,
    private readonly trustScore: TrustScoreService,
    private readonly trustRelevance: TrustRelevanceService,
  ) {}

  async cerca(
    utenteId: string,
    filtri: { testo?: string; categoria?: string; zona?: string },
  ): Promise<EsitoRicerca> {
    const utente = await this.utenti.findOne({ where: { id: utenteId } });

    const query = this.professionisti.createQueryBuilder('professionista');
    if (filtri.categoria) {
      query.andWhere('professionista.categoria = :categoria', { categoria: filtri.categoria });
    }
    if (filtri.zona) {
      query.andWhere('(professionista.quartiere = :zona OR professionista.comune = :zona)', {
        zona: filtri.zona,
      });
    }
    if (filtri.testo) {
      query.andWhere(
        '(professionista.nome ILIKE :testo OR professionista.categoria ILIKE :testo)',
        { testo: `%${filtri.testo}%` },
      );
    }

    const elenco = await query.orderBy('professionista.nome', 'ASC').getMany();
    const recensioniPer = await this.trustScore.recensioniDi(elenco.map((p) => p.id));
    const servizioCercato = filtri.categoria || filtri.testo || '';

    const risultati: RisultatoRicerca[] = elenco.map((professionista) => {
      const recensioni = recensioniPer.get(professionista.id) ?? [];
      const punteggio = this.trustScore.calcola(professionista.id, recensioni);

      const rilevanza =
        punteggio.pubblicato && utente
          ? this.trustRelevance.calcola(recensioni, professionista, utente, servizioCercato)
          : null;

      const ranking =
        punteggio.punteggio !== null && rilevanza
          ? this.trustRelevance.ranking(punteggio.punteggio, rilevanza.punteggio)
          : null;

      return { professionista, trustScore: punteggio, trustRelevance: rilevanza, ranking };
    });

    return {
      totale: risultati.length,
      pubblicati: risultati
        .filter((r) => r.trustScore.pubblicato)
        .sort((a, b) => (b.ranking ?? 0) - (a.ranking ?? 0)),
      inCostruzione: risultati.filter((r) => !r.trustScore.pubblicato),
    };
  }
}
