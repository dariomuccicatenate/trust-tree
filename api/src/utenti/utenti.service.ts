import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AggiornaUtenteDto } from './dto/aggiorna-utente.dto';
import { CercaUtentiDto } from './dto/cerca-utenti.dto';
import { CreaUtenteDto } from './dto/crea-utente.dto';
import { Utente } from './utente.entity';

const VIOLAZIONE_UNICITA = '23505';

@Injectable()
export class UtentiService {
  constructor(
    @InjectRepository(Utente)
    private readonly repository: Repository<Utente>,
  ) {}

  async crea(dto: CreaUtenteDto): Promise<Utente> {
    try {
      return await this.repository.save(this.repository.create(dto));
    } catch (errore: any) {
      if (errore?.code === VIOLAZIONE_UNICITA) {
        throw new ConflictException('Esiste gia\u0300 un utente con questa email');
      }
      throw errore;
    }
  }

  async cerca(filtri: CercaUtentiDto): Promise<{ totale: number; risultati: Utente[] }> {
    const query = this.repository.createQueryBuilder('utente');

    if (filtri.email) {
      query.andWhere('lower(utente.email) = lower(:email)', { email: filtri.email });
    }
    if (filtri.condominio) {
      query.andWhere('utente.condominio = :condominio', { condominio: filtri.condominio });
    }
    if (filtri.quartiere) {
      query.andWhere('utente.quartiere = :quartiere', { quartiere: filtri.quartiere });
    }
    if (filtri.comune) {
      query.andWhere('utente.comune = :comune', { comune: filtri.comune });
    }

    const [risultati, totale] = await query
      .orderBy('utente.creatoIl', 'DESC')
      .take(filtri.limit)
      .skip(filtri.offset)
      .getManyAndCount();

    return { totale, risultati };
  }

  async trova(id: string): Promise<Utente> {
    const utente = await this.repository.findOne({ where: { id } });
    if (!utente) {
      throw new NotFoundException(`Utente ${id} non trovato`);
    }
    return utente;
  }

  async aggiorna(id: string, dto: AggiornaUtenteDto): Promise<Utente> {
    const utente = await this.trova(id);
    Object.assign(utente, dto);
    try {
      return await this.repository.save(utente);
    } catch (errore: any) {
      if (errore?.code === VIOLAZIONE_UNICITA) {
        throw new ConflictException('Esiste gia\u0300 un utente con questa email');
      }
      throw errore;
    }
  }

  async elimina(id: string): Promise<void> {
    const risultato = await this.repository.delete(id);
    if (!risultato.affected) {
      throw new NotFoundException(`Utente ${id} non trovato`);
    }
  }
}
