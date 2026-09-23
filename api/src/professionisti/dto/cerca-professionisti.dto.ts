import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginazioneDto } from '../../common/paginazione.dto';

export class CercaProfessionistiDto extends PaginazioneDto {
  @ApiPropertyOptional({ description: 'Ricerca parziale sul nome' })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoria?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  quartiere?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comune?: string;
}
