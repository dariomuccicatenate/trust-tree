import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { MAX_DETTAGLIO_CONTESTAZIONE } from '../../common/questionario';

/** Motivazione della decisione dell'amministratore su una contestazione. */
export class EsitoContestazioneDto {
  @ApiPropertyOptional({
    maxLength: MAX_DETTAGLIO_CONTESTAZIONE,
    description: 'Visibile al professionista nella sua area.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_DETTAGLIO_CONTESTAZIONE)
  note?: string;
}
