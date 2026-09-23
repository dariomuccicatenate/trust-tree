import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { unlink } from 'fs/promises';
import { Repository } from 'typeorm';
import { GIORNI_CONSERVAZIONE_DOCUMENTO, StatoDocumento } from '../common/questionario';
import { Recensione } from '../recensioni/recensione.entity';

export interface DocumentoScaricabile {
  percorso: string;
  nome: string;
  mime: string;
}

/**
 * Verifica documentale delle referenze (domanda 15 del questionario).
 * L'esito determina il livello di verifica: un documento approvato porta la referenza da
 * V1 (dichiarata) a V2 (verificata); un documento rifiutato la riporta a V1.
 */
@Injectable()
export class VerificheService {
  constructor(
    @InjectRepository(Recensione)
    private readonly recensioni: Repository<Recensione>,
  ) {}

  /** Caricamento del documento da parte dell'autore della referenza. */
  async allega(
    recensioneId: string,
    utenteId: string,
    file: { filename: string; originalname: string; mimetype: string; size: number; path: string },
  ): Promise<Recensione> {
    const recensione = await this.recensioni
      .createQueryBuilder('recensione')
      .addSelect('recensione.documentoPercorso')
      .where('recensione.id = :id', { id: recensioneId })
      .getOne();

    if (!recensione) {
      await unlink(file.path).catch(() => undefined);
      throw new NotFoundException(`Recensione ${recensioneId} non trovata`);
    }
    if (recensione.utenteId !== utenteId) {
      await unlink(file.path).catch(() => undefined);
      throw new ForbiddenException('Puoi allegare documenti solo alle tue referenze');
    }
    if (recensione.livelloVerifica === 'V0') {
      await unlink(file.path).catch(() => undefined);
      throw new BadRequestException('Una segnalazione non prevede documenti di verifica');
    }

    // Un nuovo caricamento sostituisce il precedente.
    if (recensione.documentoPercorso) {
      await unlink(recensione.documentoPercorso).catch(() => undefined);
    }

    const conservazione = new Date();
    conservazione.setDate(conservazione.getDate() + GIORNI_CONSERVAZIONE_DOCUMENTO);

    Object.assign(recensione, {
      documentoNome: file.originalname,
      documentoMime: file.mimetype,
      documentoDimensione: file.size,
      documentoPercorso: file.path,
      documentoCaricatoIl: new Date(),
      documentoStato: 'in_attesa' as StatoDocumento,
      documentoConservazioneFinoAl: conservazione.toISOString().slice(0, 10),
      verificatoDa: null,
      verificatoIl: null,
      noteVerifica: null,
    });

    return this.recensioni.save(recensione);
  }

  /** Coda di lavoro dell'amministratore. */
  async elenco(stato: StatoDocumento = 'in_attesa'): Promise<Recensione[]> {
    return this.recensioni.find({
      where: { documentoStato: stato },
      relations: { utente: true, professionista: true },
      order: { documentoCaricatoIl: 'ASC' },
    });
  }

  async conteggi(): Promise<Record<StatoDocumento, number>> {
    const righe = await this.recensioni
      .createQueryBuilder('recensione')
      .select('recensione.documentoStato', 'stato')
      .addSelect('COUNT(*)::int', 'totale')
      .groupBy('recensione.documentoStato')
      .getRawMany<{ stato: StatoDocumento; totale: number }>();

    const conteggi: Record<StatoDocumento, number> = {
      assente: 0,
      in_attesa: 0,
      approvato: 0,
      rifiutato: 0,
    };
    righe.forEach((riga) => (conteggi[riga.stato] = riga.totale));
    return conteggi;
  }

  async approva(id: string, adminId: string, note?: string): Promise<Recensione> {
    const recensione = await this.conDocumento(id);

    recensione.documentoStato = 'approvato';
    // Prova documentale accettata: la referenza diventa V2, salvo sia gia' V3.
    if (recensione.livelloVerifica !== 'V3') {
      recensione.livelloVerifica = 'V2';
    }
    recensione.verificatoDa = adminId;
    recensione.verificatoIl = new Date();
    recensione.noteVerifica = note ?? null;

    return this.recensioni.save(recensione);
  }

  async rifiuta(id: string, adminId: string, note?: string): Promise<Recensione> {
    const recensione = await this.conDocumento(id);

    recensione.documentoStato = 'rifiutato';
    // Senza prova valida la referenza resta una dichiarazione personale.
    if (recensione.livelloVerifica === 'V2') {
      recensione.livelloVerifica = 'V1';
    }
    recensione.verificatoDa = adminId;
    recensione.verificatoIl = new Date();
    recensione.noteVerifica = note ?? null;

    return this.recensioni.save(recensione);
  }

  /** Il file non viene pubblicato: lo scarica solo l'amministratore, per la verifica. */
  async documento(id: string): Promise<DocumentoScaricabile> {
    const recensione = await this.recensioni
      .createQueryBuilder('recensione')
      .addSelect('recensione.documentoPercorso')
      .where('recensione.id = :id', { id })
      .getOne();

    if (!recensione?.documentoPercorso) {
      throw new NotFoundException('Nessun documento allegato a questa referenza');
    }

    return {
      percorso: recensione.documentoPercorso,
      nome: recensione.documentoNome ?? 'documento',
      mime: recensione.documentoMime ?? 'application/octet-stream',
    };
  }

  private async conDocumento(id: string): Promise<Recensione> {
    const recensione = await this.recensioni.findOne({ where: { id } });

    if (!recensione) {
      throw new NotFoundException(`Recensione ${id} non trovata`);
    }
    if (recensione.documentoStato === 'assente') {
      throw new BadRequestException('Questa referenza non ha un documento da verificare');
    }

    return recensione;
  }
}
