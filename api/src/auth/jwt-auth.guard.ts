import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UtenteAutenticato } from './utente-corrente.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(contesto: ExecutionContext): Promise<boolean> {
    const richiesta = contesto.switchToHttp().getRequest();
    const intestazione: string | undefined = richiesta.headers?.authorization;

    if (!intestazione?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token mancante');
    }

    try {
      const dati = await this.jwt.verifyAsync(intestazione.slice(7));
      richiesta.utente = { id: dati.sub, email: dati.email, ruolo: dati.ruolo } as UtenteAutenticato;
      return true;
    } catch {
      throw new UnauthorizedException('Token non valido o scaduto');
    }
  }
}
