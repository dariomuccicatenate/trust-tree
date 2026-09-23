import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginazioneDto } from '../../common/paginazione.dto';

export class CercaUtentiDto extends PaginazioneDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  condominio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  quartiere?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comune?: string;
}
