import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Registrazione pubblica: crea sempre un utente con ruolo "utente".
 * Il ruolo admin si assegna solo dal database o da un altro amministratore.
 */
export class RegistrazioneDto {
  @ApiProperty({ example: 'mario.verdi@example.com' })
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

  @ApiPropertyOptional({ description: 'Condominio: determina la prossimita\u0300 D2' })
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
