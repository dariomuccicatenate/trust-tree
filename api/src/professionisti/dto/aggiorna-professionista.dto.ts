import { PartialType } from '@nestjs/swagger';
import { CreaProfessionistaDto } from './crea-professionista.dto';

export class AggiornaProfessionistaDto extends PartialType(CreaProfessionistaDto) {}
