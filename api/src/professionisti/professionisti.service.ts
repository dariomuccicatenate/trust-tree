import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SOGLIA_ESPERIENZE_VALIDE,
  SOGLIA_REFERENTI_DISTINTI,
} from '../common/questionario';
import { Recensione } from '../recensioni/recensione.entity';
import { AggiornaProfessionistaDto } from './dto/aggiorna-professionista.dto';
import { CercaProfessionistiDto } from './dto/cerca-professionisti.dto';
import { CreaProfessionistaDto } from './dto/crea-professionista.dto';
import { RiepilogoProfessionistaDto } from './dto/riepilogo.dto';
import { Professionista } from './professionista.entity';

const VIOLAZIONE_UNICITA = '23505';

@Injectable()
export class ProfessionistiService {
  constructor(
    @InjectRepository(Professionista)
    private readonly repository: Repository<Professionista>,
    @InjectRepository(Recensione)
    private readonly recensioni: Repository<Recensione>,
  ) {}

  async crea(dto: CreaProfessionistaDto): Promise<Professionista> {
    try {
      return await this.repository.save(this.repository.create(dto));
    } catch (errore: any) {
      if (errore?.code === VIOLAZIONE_UNICITA) {
        throw new ConflictException('Esiste gia\u0300 un professionista con questo telefono');
      }
      throw errore;
    }
  }

  async cerca(
    filtri: CercaProfessionistiDto,
  ): Promise<{ totale: number; risultati: Professionista[] }> {
    const query = this.repository.createQueryBuilder('professionista');

    if (filtri.nome) {
      query.andWhere('professionista.nome ILIKE :nome', { nome: `%${filtri.nome}%` });
    }
    if (filtri.categoria) {
      query.andWhere('professionista.categoria = :categoria', { categoria: filtri.categoria });
    }
    if (filtri.quartiere) {
      query.andWhere('professionista.quartiere = :quartiere', { quartiere: filtri.quartiere });
    }
    if (filtri.comune) {
      query.andWhere('professionista.comune = :comune', { comune: filtri.comune });
    }

    const [risultati, totale] = await query
      .orderBy('professionista.nome', 'ASC')
      .take(filtri.limit)
      .skip(filtri.offset)
      .getManyAndCount();

    return { totale, risultati };
  }

  async trova(id: string): Promise<Professionista> {
    const professionista = await this.repository.findOne({ where: { id } });
    if (!professionista) {
      throw new NotFoundException(`Professionista ${id} non trovato`);
    }
    return professionista;
  }

  async aggiorna(id: string, dto: AggiornaProfessionistaDto): Promise<Professionista> {
    const professionista = await this.trova(id);
    Object.assign(professionista, dto);
    try {
      return await this.repository.save(professionista);
    } catch (errore: any) {
      if (errore?.code === VIOLAZIONE_UNICITA) {
        throw new ConflictException('Esiste gia\u0300 un professionista con questo telefono');
      }
      throw errore;
    }
  }

  async elimina(id: string): Promise<void> {
    const risultato = await this.repository.delete(id);
    if (!risultato.affected) {
      throw new NotFoundException(`Professionista ${id} non trovato`);
    }
  }

  /**
   * Conteggi grezzi sulle recensioni pubblicate. Le segnalazioni (V0) sono contate
   * a parte perche' non generano reputazione.
   */
  async riepilogo(id: string): Promise<RiepilogoProfessionistaDto> {
    await this.trova(id);

    const valide = this.recensioni
      .createQueryBuilder('r')
      .where('r.professionistaId = :id', { id })
      .andWhere("r.stato = 'pubblicata'")
      .andWhere("r.livelloVerifica <> 'V0'");

    const conteggi = await valide
      .clone()
      .select('COUNT(*)::int', 'esperienze')
      .addSelect('COUNT(DISTINCT r.utenteId)::int', 'referenti')
      .getRawOne<{ esperienze: number; referenti: number }>();

    const segnalazioni = await this.recensioni.count({
      where: { professionistaId: id, livelloVerifica: 'V0' },
    });

    const [perLivelloVerifica, consiglierebbe, richiamerebbe, qualita] = await Promise.all([
      this.distribuzione(id, 'livelloVerifica'),
      this.distribuzione(id, 'consiglierebbe'),
      this.distribuzione(id, 'richiamerebbe'),
      this.distribuzione(id, 'qualita'),
    ]);

    const motiviPrincipali: string[] = await this.recensioni.manager
      .query(
        `SELECT motivo AS valore, COUNT(*)::int AS totale
           FROM recensione r, unnest(r.motivi) AS motivo
          WHERE r.professionista_id = $1
            AND r.stato = 'pubblicata'
            AND r.livello_verifica <> 'V0'
          GROUP BY motivo
          ORDER BY totale DESC, motivo ASC
          LIMIT 3`,
        [id],
      )
      .then((righe: Array<{ valore: string }>) => righe.map((riga) => riga.valore));

    const esperienzeValide = conteggi?.esperienze ?? 0;
    const referentiDistinti = conteggi?.referenti ?? 0;

    return {
      professionistaId: id,
      esperienzeValide,
      referentiDistinti,
      segnalazioni,
      reputazioneInCostruzione:
        esperienzeValide < SOGLIA_ESPERIENZE_VALIDE ||
        referentiDistinti < SOGLIA_REFERENTI_DISTINTI,
      perLivelloVerifica,
      consiglierebbe,
      richiamerebbe,
      qualita,
      motiviPrincipali,
    };
  }

  private async distribuzione(
    id: string,
    colonna: 'livelloVerifica' | 'consiglierebbe' | 'richiamerebbe' | 'qualita',
  ): Promise<Record<string, number>> {
    const righe = await this.recensioni
      .createQueryBuilder('r')
      .select(`r.${colonna}`, 'valore')
      .addSelect('COUNT(*)::int', 'totale')
      .where('r.professionistaId = :id', { id })
      .andWhere("r.stato = 'pubblicata'")
      .andWhere(`r.${colonna} IS NOT NULL`)
      .groupBy(`r.${colonna}`)
      .getRawMany<{ valore: string; totale: number }>();

    return righe.reduce<Record<string, number>>((acc, riga) => {
      acc[riga.valore] = riga.totale;
      return acc;
    }, {});
  }
}
