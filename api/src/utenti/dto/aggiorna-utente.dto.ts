import { PartialType } from '@nestjs/swagger';
import { CreaUtenteDto } from './crea-utente.dto';

export class AggiornaUtenteDto extends PartialType(CreaUtenteDto) {}
