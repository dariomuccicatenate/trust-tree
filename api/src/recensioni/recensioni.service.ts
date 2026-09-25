import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Professionista } from '../professionisti/professionista.entity';
import { Utente } from '../utenti/utente.entity';
import { AggiornaRecensioneDto } from './dto/aggiorna-recensione.dto';
import { CercaRecensioniDto } from './dto/cerca-recensioni.dto';
import { CreaRecensioneDto } from './dto/crea-recensione.dto';
import { Recensione } from './recensione.entity';

/** Campi del questionario che una segnalazione (V0) non puo' valorizzare. */
const RISPOSTE = [
  'puntualita',
  'rispettoPrezzo',
  'completamento',
  'qualita',
  'correttezza',
  'richiamerebbe',
  'consiglierebbe',
  'problemiSuccessivi',
] as const;

const OBBLIGATORIE = ['qualita', 'richiamerebbe', 'consiglierebbe'] as const;

@Injectable()
export class RecensioniService {
  constructor(
    @InjectRepository(Recensione)
    private readonly repository: Repository<Recensione>,
    @InjectRepository(Utente)
    private readonly utenti: Repository<Utente>,
    @InjectRepository(Professionista)
    private readonly professionisti: Repository<Professionista>,
  ) {}

  async crea(dto: CreaRecensioneDto, utenteId: string): Promise<Recensione> {
    await this.verificaRiferimenti(utenteId, dto.professionistaId);

    const livelloVerifica = dto.livelloVerifica ?? 'V1';
    const recensione = this.repository.create({
      ...dto,
      utenteId,
      livelloVerifica,
      motivi: dto.motivi ?? [],
      stato: 'pubblicata',
    });

    this.verificaCoerenza(recensione);

    return this.repository.save(recensione);
  }

  async cerca(filtri: CercaRecensioniDto): Promise<{ totale: number; risultati: Recensione[] }> {
    const query = this.repository.createQueryBuilder('recensione');

    if (filtri.utenteId) {
      query.andWhere('recensione.utenteId = :utenteId', { utenteId: filtri.utenteId });
    }
    if (filtri.professionistaId) {
      query.andWhere('recensione.professionistaId = :professionistaId', {
        professionistaId: filtri.professionistaId,
      });
    }
    if (filtri.categoriaServizio) {
      query.andWhere('recensione.categoriaServizio = :categoriaServizio', {
        categoriaServizio: filtri.categoriaServizio,
      });
    }
    if (filtri.livelloVerifica) {
      query.andWhere('recensione.livelloVerifica = :livelloVerifica', {
        livelloVerifica: filtri.livelloVerifica,
      });
    }
    if (filtri.stato) {
      query.andWhere('recensione.stato = :stato', { stato: filtri.stato });
    }

    const [risultati, totale] = await query
      .orderBy('recensione.creatoIl', 'DESC')
      .take(filtri.limit)
      .skip(filtri.offset)
      .getManyAndCount();

    return { totale, risultati };
  }

  async trova(id: string): Promise<Recensione> {
    const recensione = await this.repository.findOne({
      where: { id },
      relations: { utente: true, professionista: true },
    });
    if (!recensione) {
      throw new NotFoundException(`Recensione ${id} non trovata`);
    }
    return recensione;
  }

  async aggiorna(
    id: string,
    dto: AggiornaRecensioneDto,
    utente: { id: string; ruolo: string },
  ): Promise<Recensione> {
    const recensione = await this.trova(id);
    this.verificaPermessi(recensione, utente);
    const aggiornata = Object.assign(recensione, dto);

    this.verificaCoerenza(aggiornata);

    return this.repository.save(aggiornata);
  }

  async elimina(id: string, utente: { id: string; ruolo: string }): Promise<void> {
    const recensione = await this.trova(id);
    this.verificaPermessi(recensione, utente);
    await this.repository.delete(recensione.id);
  }

  /** Una referenza puo' essere modificata o rimossa dall'autore o da un amministratore. */
  private verificaPermessi(recensione: Recensione, utente: { id: string; ruolo: string }): void {
    if (utente.ruolo !== 'admin' && recensione.utenteId !== utente.id) {
      throw new ForbiddenException('Puoi intervenire solo sulle tue referenze');
    }
  }

  private async verificaRiferimenti(utenteId: string, professionistaId: string): Promise<void> {
    const [utente, professionista, propria] = await Promise.all([
      this.utenti.count({ where: { id: utenteId } }),
      this.professionisti.count({ where: { id: professionistaId } }),
      this.professionisti.count({ where: { id: professionistaId, utenteId } }),
    ]);

    if (!utente) {
      throw new NotFoundException(`Utente ${utenteId} non trovato`);
    }
    if (!professionista) {
      throw new NotFoundException(`Professionista ${professionistaId} non trovato`);
    }
    // Un account di tipo professionista non costruisce la reputazione della propria scheda.
    if (propria) {
      throw new ForbiddenException('Non puoi lasciare una referenza sulla tua stessa scheda');
    }
  }

  /**
   * Regole del questionario 1.0:
   * - V0 e' una segnalazione senza esperienza personale, quindi non porta risposte;
   * - negli altri livelli qualita, richiamerebbe e consiglierebbe sono obbligatorie.
   * Gli stessi vincoli sono replicati come CHECK sul database.
   */
  private verificaCoerenza(recensione: Partial<Recensione>): void {
    if (recensione.livelloVerifica === 'V0') {
      const valorizzate = RISPOSTE.filter((campo) => recensione[campo] != null);
      if (valorizzate.length > 0 || (recensione.motivi?.length ?? 0) > 0) {
        throw new BadRequestException(
          'Una segnalazione (V0) non puo contenere risposte al questionario',
        );
      }
      return;
    }

    const mancanti = OBBLIGATORIE.filter((campo) => recensione[campo] == null);
    if (mancanti.length > 0) {
      throw new BadRequestException(`Risposte obbligatorie mancanti: ${mancanti.join(', ')}`);
    }
  }
}
