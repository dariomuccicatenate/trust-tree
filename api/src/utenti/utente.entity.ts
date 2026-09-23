import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Recensione } from '../recensioni/recensione.entity';

export type Ruolo = 'utente' | 'admin';

@Entity('utente')
export class Utente {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'giulia.neri@example.com' })
  @Column({ type: 'text' })
  email: string;

  @ApiProperty()
  @Column({ type: 'text' })
  nome: string;

  @ApiProperty()
  @Column({ type: 'text' })
  cognome: string;

  @ApiPropertyOptional({ description: 'Prossimità D2: stesso condominio' })
  @Column({ type: 'text', nullable: true })
  condominio: string | null;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  quartiere: string | null;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  comune: string | null;

  /** Hash bcrypt. La colonna non viene selezionata se non richiesta esplicitamente. */
  @Exclude()
  @Column({ name: 'password_hash', type: 'text', nullable: true, select: false })
  passwordHash?: string | null;

  @ApiProperty({ enum: ['utente', 'admin'], default: 'utente' })
  @Column({ type: 'text', default: 'utente' })
  ruolo: Ruolo;

  @ApiProperty()
  @CreateDateColumn({ name: 'creato_il', type: 'timestamptz' })
  creatoIl: Date;

  @OneToMany(() => Recensione, (recensione) => recensione.utente)
  recensioni: Recensione[];
}
