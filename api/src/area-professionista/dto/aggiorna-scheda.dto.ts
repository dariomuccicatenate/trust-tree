import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength, ValidateIf } from 'class-validator';
import { REGEX_CELLULARE } from '../../common/questionario';

/**
 * Dati che il professionista puo' cambiare da solo sulla propria scheda.
 *
 * Nome e categoria restano all'amministratore: sono i due dati su cui si e' formata la
 * reputazione gia' raccolta, cambiarli a punteggio acquisito significherebbe spostare
 * referenze da un soggetto o da un servizio a un altro.
 */
export class AggiornaSchedaDto {
  @ApiPropertyOptional({
    example: '+39 333 1234567',
    description: 'Numero di cellulare pubblicato sulla scheda. Stringa vuota per non pubblicarlo.',
  })
  @IsOptional()
  @IsString()
  // La stringa vuota e' ammessa e significa "togli il contatto": non la valido come numero.
  @ValidateIf((oggetto: AggiornaSchedaDto) => !!oggetto.telefono)
  @Matches(REGEX_CELLULARE, {
    message: 'Il contatto deve essere un numero di cellulare valido, es. +39 333 1234567',
  })
  telefono?: string;

  @ApiPropertyOptional({ description: 'Zona in cui lavora' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  quartiere?: string;

  @ApiPropertyOptional({ description: 'Comune o provincia in cui lavora' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  comune?: string;
}
