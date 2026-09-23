import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { STATI_RECENSIONE, StatoRecensione } from '../../common/questionario';
import { CreaRecensioneDto } from './crea-recensione.dto';

/**
 * Il professionista non e' modificabile: una recensione riguarda sempre la stessa coppia.
 * Lo stato consente di escluderla dai conteggi senza cancellarla.
 */
export class AggiornaRecensioneDto extends PartialType(
  OmitType(CreaRecensioneDto, ['professionistaId'] as const),
) {
  @ApiPropertyOptional({ enum: STATI_RECENSIONE })
  @IsOptional()
  @IsIn(STATI_RECENSIONE as unknown as string[])
  stato?: StatoRecensione;
}
