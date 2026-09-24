import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { REGEX_CELLULARE } from '../../common/questionario';

export class CreaProfessionistaDto {
  @ApiProperty({ example: 'Mario Rossi' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  nome: string;

  @ApiProperty({ example: 'idraulico', description: 'Categoria della tassonomia controllata' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  categoria: string;

  @ApiPropertyOptional({
    example: '+39 333 1234567',
    description: 'Numero di cellulare italiano, con o senza prefisso internazionale',
  })
  @IsOptional()
  @IsString()
  @Matches(REGEX_CELLULARE, {
    message: 'Il contatto deve essere un numero di cellulare valido, es. +39 333 1234567',
  })
  telefono?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  quartiere?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  comune?: string;
}
