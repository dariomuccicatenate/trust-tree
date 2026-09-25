import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StatoContestazione } from '../common/questionario';
import { Recensione } from '../recensioni/recensione.entity';

/**
 * Decisione delle contestazioni, riservata all'amministratore.
 *
 *   accolta  -> la referenza passa a 'esclusa': resta nel sistema, visibile nello storico,
 *               ma non concorre piu' al Trust Score ne' alla Trust Relevance;
 *   respinta -> la referenza resta pubblicata e la richiesta resta tracciata.
 *
 * In nessun caso la referenza viene cancellata o modificata nel contenuto.
 */
@Injectable()
export class ContestazioniService {
  constructor(
    @InjectRepository(Recensione)
    private readonly recensioni: Repository<Recensione>,
  ) {}

  async elenco(stato: StatoContestazione = 'aperta'): Promise<Recensione[]> {
    return this.recensioni.find({
      where: { contestazioneStato: stato },
      relations: { utente: true, professionista: true },
      order: { contestazioneApertaIl: 'ASC' },
    });
  }

  async conteggi(): Promise<Record<StatoContestazione, number>> {
    const righe = await this.recensioni
      .createQueryBuilder('r')
      .select('r.contestazioneStato', 'stato')
      .addSelect('COUNT(*)::int', 'totale')
      .groupBy('r.contestazioneStato')
      .getRawMany<{ stato: StatoContestazione; totale: number }>();

    const conteggi: Record<StatoContestazione, number> = {
      nessuna: 0,
      aperta: 0,
      accolta: 0,
      respinta: 0,
    };
    righe.forEach((riga) => (conteggi[riga.stato] = riga.totale));
    return conteggi;
  }

  /** Richiesta fondata: la referenza esce dal calcolo dei punteggi. */
  async accogli(id: string, adminId: string, note?: string): Promise<Recensione> {
    const recensione = await this.conRichiestaAperta(id);

    recensione.contestazioneStato = 'accolta';
    recensione.stato = 'esclusa';
    recensione.contestazioneDecisaIl = new Date();
    recensione.contestazioneDecisaDa = adminId;
    recensione.contestazioneNoteEsito = note ?? null;

    return this.recensioni.save(recensione);
  }

  /** Richiesta infondata: la referenza resta pubblicata. */
  async respingi(id: string, adminId: string, note?: string): Promise<Recensione> {
    const recensione = await this.conRichiestaAperta(id);

    recensione.contestazioneStato = 'respinta';
    recensione.contestazioneDecisaIl = new Date();
    recensione.contestazioneDecisaDa = adminId;
    recensione.contestazioneNoteEsito = note ?? null;

    return this.recensioni.save(recensione);
  }

  private async conRichiestaAperta(id: string): Promise<Recensione> {
    const recensione = await this.recensioni.findOne({ where: { id } });

    if (!recensione) {
      throw new NotFoundException(`Recensione ${id} non trovata`);
    }
    if (recensione.contestazioneStato !== 'aperta') {
      throw new BadRequestException('Su questa referenza non c’è una richiesta da decidere');
    }

    return recensione;
  }
}
