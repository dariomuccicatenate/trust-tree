import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { CATEGORIE_SERVIZIO, CategoriaServizio, REGEX_CELLULARE } from '../../common/questionario';

/**
 * Registrazione di un professionista: crea l'account con ruolo "professionista" e,
 * insieme, la scheda che lo rappresenta. Il tipo di utenza si stabilisce qui e non
 * e' modificabile dall'interessato.
 */
export class RegistrazioneProfessionistaDto {
  @ApiProperty({ example: 'mario.rossi@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 8, description: 'Almeno 8 caratteri' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

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

  @ApiPropertyOptional({
    example: 'Idraulica Rossi',
    description: 'Ragione sociale, se diversa da nome e cognome. In sua assenza vale il nominativo.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  nomeAttivita?: string;

  @ApiProperty({ enum: CATEGORIE_SERVIZIO, example: 'idraulico' })
  @IsIn(CATEGORIE_SERVIZIO as unknown as string[])
  categoria: CategoriaServizio;

  @ApiPropertyOptional({ example: '+39 333 1234567' })
  @IsOptional()
  @IsString()
  @Matches(REGEX_CELLULARE, {
    message: 'Il contatto deve essere un numero di cellulare valido, es. +39 333 1234567',
  })
  telefono?: string;

  @ApiPropertyOptional({ description: 'Zona in cui lavora' })
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
