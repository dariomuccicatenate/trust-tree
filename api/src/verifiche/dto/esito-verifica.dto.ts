import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class EsitoVerificaDto {
  @ApiPropertyOptional({ maxLength: 300, description: 'Nota interna sull\u2019esito' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}
