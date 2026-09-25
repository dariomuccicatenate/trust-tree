import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import {
  MAX_DETTAGLIO_CONTESTAZIONE,
  MOTIVI_CONTESTAZIONE,
  MotivoContestazione,
} from '../../common/questionario';

/** Richiesta di contestazione di una referenza ricevuta. La decide l'amministratore. */
export class CreaContestazioneDto {
  @ApiProperty({ format: 'uuid', description: 'Referenza da contestare' })
  @IsUUID()
  recensioneId: string;

  @ApiProperty({ enum: MOTIVI_CONTESTAZIONE, example: 'lavoro_non_mio' })
  @IsIn(MOTIVI_CONTESTAZIONE as unknown as string[])
  motivo: MotivoContestazione;

  @ApiPropertyOptional({
    maxLength: MAX_DETTAGLIO_CONTESTAZIONE,
    description: 'Spiegazione per l’amministratore: più è circostanziata, più è rapida la decisione.',
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(MAX_DETTAGLIO_CONTESTAZIONE)
  dettaglio?: string;
}
