import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { Professionista } from '../professionisti/professionista.entity';
import { Utente } from '../utenti/utente.entity';
import { RegistrazioneDto } from './dto/registrazione.dto';
import { RegistrazioneProfessionistaDto } from './dto/registrazione-professionista.dto';

export interface RispostaLogin {
  accessToken: string;
  utente: Utente;
  /** Presente solo per gli account di tipo professionista: la scheda che rappresentano. */
  professionista?: Professionista;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Utente)
    private readonly utenti: Repository<Utente>,
    @InjectRepository(Professionista)
    private readonly professionisti: Repository<Professionista>,
    private readonly jwt: JwtService,
  ) {}

  /** Registrazione pubblica: l'utente nasce con ruolo "utente" e viene subito autenticato. */
  async registra(dto: RegistrazioneDto): Promise<RispostaLogin> {
    await this.verificaEmailLibera(dto.email);

    const utente = await this.utenti.save(
      this.utenti.create({
        email: dto.email.trim(),
        nome: dto.nome.trim(),
        cognome: dto.cognome.trim(),
        condominio: dto.condominio?.trim() || null,
        quartiere: dto.quartiere?.trim() || null,
        comune: dto.comune?.trim() || null,
        passwordHash: await bcrypt.hash(dto.password, 10),
        ruolo: 'utente',
      }),
    );

    delete utente.passwordHash;

    return this.conToken(utente);
  }

  /**
   * Registrazione di un professionista: un solo passaggio crea l'account con ruolo
   * "professionista" e la scheda che lo rappresenta. Le due scritture stanno nella
   * stessa transazione: se la scheda non nasce, l'account non resta orfano.
   *
   * La scheda parte senza referenze, quindi con reputazione in costruzione: iscriversi
   * non genera punteggio.
   */
  async registraProfessionista(dto: RegistrazioneProfessionistaDto): Promise<RispostaLogin> {
    await this.verificaEmailLibera(dto.email);

    const telefono = dto.telefono?.trim() || null;
    if (telefono) {
      const occupato = await this.professionisti.count({ where: { telefono } });
      if (occupato > 0) {
        throw new ConflictException('Esiste già una scheda con questo numero di cellulare');
      }
    }

    const { utente, professionista } = await this.utenti.manager.transaction(async (gestore) => {
      const nuovo = await gestore.save(
        gestore.create(Utente, {
          email: dto.email.trim(),
          nome: dto.nome.trim(),
          cognome: dto.cognome.trim(),
          condominio: null,
          quartiere: dto.quartiere?.trim() || null,
          comune: dto.comune?.trim() || null,
          passwordHash: await bcrypt.hash(dto.password, 10),
          ruolo: 'professionista',
        }),
      );

      const scheda = await gestore.save(
        gestore.create(Professionista, {
          nome: dto.nomeAttivita?.trim() || `${dto.nome.trim()} ${dto.cognome.trim()}`,
          categoria: dto.categoria,
          telefono,
          quartiere: dto.quartiere?.trim() || null,
          comune: dto.comune?.trim() || null,
          utenteId: nuovo.id,
        }),
      );

      return { utente: nuovo, professionista: scheda };
    });

    delete utente.passwordHash;

    return this.conToken(utente, professionista);
  }

  async login(email: string, password: string): Promise<RispostaLogin> {
    const utente = await this.utenti
      .createQueryBuilder('utente')
      .addSelect('utente.passwordHash')
      .where('lower(utente.email) = lower(:email)', { email })
      .getOne();

    // Confronto sempre l'hash (anche con utente inesistente) per non rivelare le email registrate.
    const hash = utente?.passwordHash ?? '$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidi';
    const valida = await bcrypt.compare(password, hash);

    if (!utente || !valida) {
      throw new UnauthorizedException('Email o password non corretti');
    }

    delete utente.passwordHash;

    const professionista =
      utente.ruolo === 'professionista'
        ? (await this.professionisti.findOne({ where: { utenteId: utente.id } })) ?? undefined
        : undefined;

    return this.conToken(utente, professionista);
  }

  async profilo(id: string): Promise<Utente> {
    const utente = await this.utenti.findOne({ where: { id } });
    if (!utente) {
      throw new UnauthorizedException('Utente non più valido');
    }
    return utente;
  }

  private async verificaEmailLibera(email: string): Promise<void> {
    const esistente = await this.utenti
      .createQueryBuilder('utente')
      .where('lower(utente.email) = lower(:email)', { email })
      .getCount();

    if (esistente > 0) {
      throw new ConflictException('Esiste già un account con questa email');
    }
  }

  private async conToken(utente: Utente, professionista?: Professionista): Promise<RispostaLogin> {
    return {
      accessToken: await this.jwt.signAsync({
        sub: utente.id,
        email: utente.email,
        ruolo: utente.ruolo,
      }),
      utente,
      professionista,
    };
  }
}
