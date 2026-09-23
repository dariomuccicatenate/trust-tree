import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import {
  COMPLETAMENTO,
  Completamento,
  GIUDIZI,
  Giudizio,
  INTENZIONI,
  Intenzione,
  LIVELLI_VERIFICA,
  LivelloVerifica,
  MOTIVI,
  Motivo,
  PERIODI_UTILIZZO,
  PeriodoUtilizzo,
  PROBLEMI_SUCCESSIVI,
  ProblemiSuccessivi,
  PUNTUALITA,
  Puntualita,
  RISPETTO_PREZZO,
  RispettoPrezzo,
  STATI_RECENSIONE,
  StatoRecensione,
  STATI_DOCUMENTO,
  StatoDocumento,
  CATEGORIE_SERVIZIO,
  CategoriaServizio,
  FASCE_IMPORTO,
  FasciaImporto,
} from '../common/questionario';
import { Professionista } from '../professionisti/professionista.entity';
import { Utente } from '../utenti/utente.entity';

/**
 * Una esperienza dichiarata da un utente su un professionista.
 * Lo stesso utente puo' avere piu' recensioni sullo stesso professionista.
 */
@Entity('recensione')
@Index(['professionistaId', 'stato'])
export class Recensione {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ format: 'uuid' })
  @Column({ name: 'utente_id', type: 'uuid' })
  utenteId: string;

  @ApiProperty({ format: 'uuid' })
  @Column({ name: 'professionista_id', type: 'uuid' })
  professionistaId: string;

  @ApiProperty({ enum: CATEGORIE_SERVIZIO, description: 'Domanda 2: categoria della tassonomia' })
  @Column({ name: 'categoria_servizio', type: 'text' })
  categoriaServizio: CategoriaServizio;

  @ApiPropertyOptional({ maxLength: 150, description: 'Domanda 2: breve descrizione del lavoro' })
  @Column({ name: 'descrizione_lavoro', type: 'varchar', length: 150, nullable: true })
  descrizioneLavoro: string | null;

  @ApiProperty({ enum: PERIODI_UTILIZZO })
  @Column({ name: 'periodo_utilizzo', type: 'text' })
  periodoUtilizzo: PeriodoUtilizzo;

  @ApiPropertyOptional({ enum: FASCE_IMPORTO, description: 'Domanda 4, facoltativa' })
  @Column({ name: 'fascia_importo', type: 'text', nullable: true })
  fasciaImporto: FasciaImporto | null;

  @ApiPropertyOptional({ enum: PUNTUALITA })
  @Column({ type: 'text', nullable: true })
  puntualita: Puntualita | null;

  @ApiPropertyOptional({ enum: RISPETTO_PREZZO })
  @Column({ name: 'rispetto_prezzo', type: 'text', nullable: true })
  rispettoPrezzo: RispettoPrezzo | null;

  @ApiPropertyOptional({ enum: COMPLETAMENTO })
  @Column({ type: 'text', nullable: true })
  completamento: Completamento | null;

  @ApiPropertyOptional({ enum: GIUDIZI })
  @Column({ type: 'text', nullable: true })
  qualita: Giudizio | null;

  @ApiPropertyOptional({ enum: GIUDIZI })
  @Column({ type: 'text', nullable: true })
  correttezza: Giudizio | null;

  @ApiPropertyOptional({ enum: INTENZIONI })
  @Column({ type: 'text', nullable: true })
  richiamerebbe: Intenzione | null;

  @ApiPropertyOptional({ enum: INTENZIONI, description: 'Domanda 11, indicatore principale' })
  @Column({ type: 'text', nullable: true })
  consiglierebbe: Intenzione | null;

  @ApiPropertyOptional({ enum: PROBLEMI_SUCCESSIVI })
  @Column({ name: 'problemi_successivi', type: 'text', nullable: true })
  problemiSuccessivi: ProblemiSuccessivi | null;

  @ApiProperty({ enum: MOTIVI, isArray: true, maxItems: 2 })
  @Column({ type: 'text', array: true, default: () => "'{}'" })
  motivi: Motivo[];

  @ApiPropertyOptional({ maxLength: 300 })
  @Column({ type: 'varchar', length: 300, nullable: true })
  commento: string | null;

  @ApiProperty({ enum: LIVELLI_VERIFICA, default: 'V1' })
  @Column({ name: 'livello_verifica', type: 'text', default: 'V1' })
  livelloVerifica: LivelloVerifica;

  @ApiProperty({ enum: STATI_RECENSIONE, default: 'pubblicata' })
  @Column({ type: 'text', default: 'pubblicata' })
  stato: StatoRecensione;


  // --- documento a supporto della verifica (domanda 15) ---

  @ApiPropertyOptional()
  @Column({ name: 'documento_nome', type: 'text', nullable: true })
  documentoNome: string | null;

  @ApiPropertyOptional()
  @Column({ name: 'documento_mime', type: 'text', nullable: true })
  documentoMime: string | null;

  @ApiPropertyOptional()
  @Column({ name: 'documento_dimensione', type: 'int', nullable: true })
  documentoDimensione: number | null;

  /** Percorso sul volume dei documenti: non viene esposto ai client. */
  @Exclude()
  @Column({ name: 'documento_percorso', type: 'text', nullable: true, select: false })
  documentoPercorso?: string | null;

  @ApiPropertyOptional()
  @Column({ name: 'documento_caricato_il', type: 'timestamptz', nullable: true })
  documentoCaricatoIl: Date | null;

  @ApiProperty({ enum: ['assente', 'in_attesa', 'approvato', 'rifiutato'], default: 'assente' })
  @Column({ name: 'documento_stato', type: 'text', default: 'assente' })
  documentoStato: StatoDocumento;

  @ApiPropertyOptional({ description: "Retention del documento caricato" })
  @Column({ name: 'documento_conservazione_fino_al', type: 'date', nullable: true })
  documentoConservazioneFinoAl: string | null;

  @ApiPropertyOptional({ format: 'uuid' })
  @Column({ name: 'verificato_da', type: 'uuid', nullable: true })
  verificatoDa: string | null;

  @ApiPropertyOptional()
  @Column({ name: 'verificato_il', type: 'timestamptz', nullable: true })
  verificatoIl: Date | null;

  @ApiPropertyOptional()
  @Column({ name: 'note_verifica', type: 'text', nullable: true })
  noteVerifica: string | null;
  @ApiProperty()
  @CreateDateColumn({ name: 'creato_il', type: 'timestamptz' })
  creatoIl: Date;

  @ManyToOne(() => Utente, (utente) => utente.recensioni, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'utente_id' })
  utente: Utente;

  @ManyToOne(() => Professionista, (professionista) => professionista.recensioni, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'professionista_id' })
  professionista: Professionista;
}
