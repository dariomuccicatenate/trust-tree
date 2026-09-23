import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { Ruolo } from '../utenti/utente.entity';

export interface UtenteAutenticato {
  id: string;
  email: string;
  ruolo: Ruolo;
}

/** Utente estratto dal token dal JwtAuthGuard. */
export const UtenteCorrente = createParamDecorator(
  (_dato: unknown, contesto: ExecutionContext): UtenteAutenticato => {
    return contesto.switchToHttp().getRequest().utente;
  },
);
