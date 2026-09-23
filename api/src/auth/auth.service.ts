import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { Utente } from '../utenti/utente.entity';
import { RegistrazioneDto } from './dto/registrazione.dto';

export interface RispostaLogin {
  accessToken: string;
  utente: Utente;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Utente)
    private readonly utenti: Repository<Utente>,
    private readonly jwt: JwtService,
  ) {}

  /** Registrazione pubblica: l'utente nasce con ruolo "utente" e viene subito autenticato. */
  async registra(dto: RegistrazioneDto): Promise<RispostaLogin> {
    const esistente = await this.utenti
      .createQueryBuilder('utente')
      .where('lower(utente.email) = lower(:email)', { email: dto.email })
      .getCount();

    if (esistente > 0) {
      throw new ConflictException('Esiste già un account con questa email');
    }

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

    return {
      accessToken: await this.jwt.signAsync({
        sub: utente.id,
        email: utente.email,
        ruolo: utente.ruolo,
      }),
      utente,
    };
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

    return {
      accessToken: await this.jwt.signAsync({
        sub: utente.id,
        email: utente.email,
        ruolo: utente.ruolo,
      }),
      utente,
    };
  }

  async profilo(id: string): Promise<Utente> {
    const utente = await this.utenti.findOne({ where: { id } });
    if (!utente) {
      throw new UnauthorizedException('Utente non piu\u0300 valido');
    }
    return utente;
  }
}
