import { SetMetadata } from '@nestjs/common';
import { Ruolo } from '../utenti/utente.entity';

export const RUOLI = 'ruoli';

/** Limita una rotta ai ruoli indicati. Va usato insieme a JwtAuthGuard e RuoliGuard. */
export const Ruoli = (...ruoli: Ruolo[]) => SetMetadata(RUOLI, ruoli);
