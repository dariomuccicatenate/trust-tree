import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginazioneDto } from '../../common/paginazione.dto';
import {
  LIVELLI_VERIFICA,
  LivelloVerifica,
  STATI_RECENSIONE,
  StatoRecensione,
} from '../../common/questionario';

export class CercaRecensioniDto extends PaginazioneDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  utenteId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  professionistaId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoriaServizio?: string;

  @ApiPropertyOptional({ enum: LIVELLI_VERIFICA })
  @IsOptional()
  @IsIn(LIVELLI_VERIFICA as unknown as string[])
  livelloVerifica?: LivelloVerifica;

  @ApiPropertyOptional({ enum: STATI_RECENSIONE })
  @IsOptional()
  @IsIn(STATI_RECENSIONE as unknown as string[])
  stato?: StatoRecensione;
}
