import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StatoContestazione } from '../common/questionario';
import { Professionista } from '../professionisti/professionista.entity';
import { ProfessionistiService } from '../professionisti/professionisti.service';
import { RiepilogoProfessionistaDto } from '../professionisti/dto/riepilogo.dto';
import { TrustScoreService } from '../punteggi/trust-score.service';
import { Recensione } from '../recensioni/recensione.entity';
import { AggiornaSchedaDto } from './dto/aggiorna-scheda.dto';
import { CreaContestazioneDto } from './dto/crea-contestazione.dto';
import { ReferenzaRicevutaDto } from './referenza-ricevuta.dto';

/** Violazione di unicita' in PostgreSQL: qui, il telefono gia' presente su un'altra scheda. */
const VIOLAZIONE_UNICITA = '23505';

export interface CruscottoProfessionista {
  professionista: Professionista;
  riepilogo: RiepilogoProfessionistaDto;
  trustScore: unknown;
  referenze: ReferenzaRicevutaDto[];
  contestazioni: Record<StatoContestazione, number>;
}

/**
 * Area del professionista: rivede le referenze ricevute e, se ritiene che una non
 * gli appartenga o sia impropria, ne chiede la contestazione all'amministratore.
 *
 * Il professionista non modifica ne' cancella nulla: puo' soltanto aprire una
 * richiesta motivata, che resta tracciata insieme al suo esito.
 */
@Injectable()
export class AreaProfessionistaService {
  constructor(
    @InjectRepository(Professionista)
    private readonly professionisti: Repository<Professionista>,
    @InjectRepository(Recensione)
    private readonly recensioni: Repository<Recensione>,
    private readonly schede: ProfessionistiService,
    private readonly trustScore: TrustScoreService,
  ) {}

  /** La scheda governata dall'account autenticato. */
  async scheda(utenteId: string): Promise<Professionista> {
    const professionista = await this.professionisti.findOne({ where: { utenteId } });

    if (!professionista) {
      throw new NotFoundException(
        'Nessuna scheda collegata a questo account: chiedi all’amministratore di collegarla.',
      );
    }
    return professionista;
  }

  /**
   * Aggiornamento dei dati che il professionista governa da solo: contatto e zona.
   * Nome e categoria restano all'amministratore (si veda AggiornaSchedaDto).
   */
  async aggiornaScheda(utenteId: string, dto: AggiornaSchedaDto): Promise<Professionista> {
    const professionista = await this.scheda(utenteId);

    if (dto.telefono !== undefined) {
      // Campo svuotato: il contatto sparisce dalla scheda pubblica.
      professionista.telefono = dto.telefono.trim() || null;
    }
    if (dto.quartiere !== undefined) {
      professionista.quartiere = dto.quartiere.trim() || null;
    }
    if (dto.comune !== undefined) {
      professionista.comune = dto.comune.trim() || null;
    }

    try {
      return await this.professionisti.save(professionista);
    } catch (errore: any) {
      if (errore?.code === VIOLAZIONE_UNICITA) {
        throw new ConflictException(
          'Questo numero di cellulare è già pubblicato su un’altra scheda',
        );
      }
      throw errore;
    }
  }

  async cruscotto(utenteId: string): Promise<CruscottoProfessionista> {
    const professionista = await this.scheda(utenteId);

    const [riepilogo, trustScore, referenze, contestazioni] = await Promise.all([
      this.schede.riepilogo(professionista.id),
      this.trustScore.perProfessionista(professionista.id),
      this.referenze(professionista.id),
      this.conteggiContestazioni(professionista.id),
    ]);

    return { professionista, riepilogo, trustScore, referenze, contestazioni };
  }

  /** Referenze ricevute, in ordine dalla piu' recente. Senza l'identita' degli autori. */
  async referenze(professionistaId: string): Promise<ReferenzaRicevutaDto[]> {
    const righe = await this.recensioni.find({
      where: { professionistaId },
      order: { creatoIl: 'DESC' },
    });

    return righe.map((riga) => ReferenzaRicevutaDto.da(riga));
  }

  async apriContestazione(
    utenteId: string,
    dto: CreaContestazioneDto,
  ): Promise<ReferenzaRicevutaDto> {
    const professionista = await this.scheda(utenteId);
    const recensione = await this.recensioni.findOne({ where: { id: dto.recensioneId } });

    if (!recensione) {
      throw new NotFoundException('Referenza non trovata');
    }
    if (recensione.professionistaId !== professionista.id) {
      // Non rivelo l'esistenza di referenze di altri professionisti.
      throw new ForbiddenException('Puoi contestare solo le referenze ricevute da te');
    }
    if (recensione.contestazioneStato === 'aperta') {
      throw new ConflictException('Su questa referenza c’è già una richiesta in esame');
    }
    if (recensione.contestazioneStato === 'accolta') {
      throw new ConflictException(
        'Questa referenza è già stata esclusa dal calcolo dei punteggi',
      );
    }
    if (recensione.contestazioneStato === 'respinta') {
      throw new ConflictException(
        'Una richiesta su questa referenza è già stata esaminata e respinta: per riaprirla scrivi all’amministratore.',
      );
    }

    Object.assign(recensione, {
      contestazioneStato: 'aperta' as StatoContestazione,
      contestazioneMotivo: dto.motivo,
      contestazioneDettaglio: dto.dettaglio?.trim() || null,
      contestazioneApertaIl: new Date(),
      contestazioneApertaDa: utenteId,
      contestazioneDecisaIl: null,
      contestazioneDecisaDa: null,
      contestazioneNoteEsito: null,
    });

    const salvata = await this.recensioni.save(recensione);
    return ReferenzaRicevutaDto.da(salvata);
  }

  private async conteggiContestazioni(
    professionistaId: string,
  ): Promise<Record<StatoContestazione, number>> {
    const righe = await this.recensioni
      .createQueryBuilder('r')
      .select('r.contestazioneStato', 'stato')
      .addSelect('COUNT(*)::int', 'totale')
      .where('r.professionistaId = :professionistaId', { professionistaId })
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
}
