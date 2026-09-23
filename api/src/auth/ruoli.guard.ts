import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Ruolo } from '../utenti/utente.entity';
import { RUOLI } from './ruoli.decorator';

@Injectable()
export class RuoliGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(contesto: ExecutionContext): boolean {
    const richiesti = this.reflector.getAllAndOverride<Ruolo[]>(RUOLI, [
      contesto.getHandler(),
      contesto.getClass(),
    ]);

    if (!richiesti?.length) {
      return true;
    }

    const utente = contesto.switchToHttp().getRequest().utente;
    if (!utente || !richiesti.includes(utente.ruolo)) {
      throw new ForbiddenException('Operazione riservata agli amministratori');
    }

    return true;
  }
}
