import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Recensione } from '../recensioni/recensione.entity';

@Entity('professionista')
export class Professionista {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Mario Rossi' })
  @Column({ type: 'text' })
  nome: string;

  @ApiProperty({ example: 'idraulico', description: 'Tassonomia controllata dei servizi' })
  @Column({ type: 'text' })
  categoria: string;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  telefono: string | null;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  quartiere: string | null;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  comune: string | null;

  @ApiProperty()
  @CreateDateColumn({ name: 'creato_il', type: 'timestamptz' })
  creatoIl: Date;

  @OneToMany(() => Recensione, (recensione) => recensione.professionista)
  recensioni: Recensione[];
}
