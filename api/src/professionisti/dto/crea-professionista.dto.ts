import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

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

  @ApiPropertyOptional({ example: '+390600000001' })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9 ]{6,20}$/, { message: 'telefono non valido' })
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
