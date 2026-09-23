import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreaUtenteDto {
  @ApiProperty({ example: 'giulia.neri@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  nome: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  cognome: string;

  @ApiPropertyOptional({ description: 'Identificativo del condominio (prossimita\u0300 D2)' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  condominio?: string;

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
