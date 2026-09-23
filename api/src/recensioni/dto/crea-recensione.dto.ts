import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  CATEGORIE_SERVIZIO,
  CategoriaServizio,
  COMPLETAMENTO,
  Completamento,
  GIUDIZI,
  Giudizio,
  INTENZIONI,
  Intenzione,
  LIVELLI_VERIFICA,
  LivelloVerifica,
  FASCE_IMPORTO,
  FasciaImporto,
  MAX_DESCRIZIONE_LAVORO,
  MAX_MOTIVI,
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
} from '../../common/questionario';

export class CreaRecensioneDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  professionistaId: string;

  @ApiProperty({ enum: CATEGORIE_SERVIZIO, description: 'Domanda 2: categoria della tassonomia' })
  @IsIn(CATEGORIE_SERVIZIO as unknown as string[])
  categoriaServizio: CategoriaServizio;

  @ApiPropertyOptional({
    maxLength: MAX_DESCRIZIONE_LAVORO,
    description: 'Domanda 2: breve descrizione del lavoro, facoltativa',
  })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_DESCRIZIONE_LAVORO)
  descrizioneLavoro?: string;

  @ApiProperty({ enum: PERIODI_UTILIZZO, description: 'Domanda 3' })
  @IsIn(PERIODI_UTILIZZO as unknown as string[])
  periodoUtilizzo: PeriodoUtilizzo;

  @ApiPropertyOptional({ enum: FASCE_IMPORTO, description: 'Domanda 4, facoltativa' })
  @IsOptional()
  @IsIn(FASCE_IMPORTO as unknown as string[])
  fasciaImporto?: FasciaImporto;

  @ApiPropertyOptional({ enum: PUNTUALITA, description: 'Domanda 5' })
  @IsOptional()
  @IsIn(PUNTUALITA as unknown as string[])
  puntualita?: Puntualita;

  @ApiPropertyOptional({ enum: RISPETTO_PREZZO, description: 'Domanda 6' })
  @IsOptional()
  @IsIn(RISPETTO_PREZZO as unknown as string[])
  rispettoPrezzo?: RispettoPrezzo;

  @ApiPropertyOptional({ enum: COMPLETAMENTO, description: 'Domanda 7' })
  @IsOptional()
  @IsIn(COMPLETAMENTO as unknown as string[])
  completamento?: Completamento;

  @ApiPropertyOptional({ enum: GIUDIZI, description: 'Domanda 8' })
  @IsOptional()
  @IsIn(GIUDIZI as unknown as string[])
  qualita?: Giudizio;

  @ApiPropertyOptional({ enum: GIUDIZI, description: 'Domanda 9' })
  @IsOptional()
  @IsIn(GIUDIZI as unknown as string[])
  correttezza?: Giudizio;

  @ApiPropertyOptional({ enum: INTENZIONI, description: 'Domanda 10' })
  @IsOptional()
  @IsIn(INTENZIONI as unknown as string[])
  richiamerebbe?: Intenzione;

  @ApiPropertyOptional({ enum: INTENZIONI, description: 'Domanda 11' })
  @IsOptional()
  @IsIn(INTENZIONI as unknown as string[])
  consiglierebbe?: Intenzione;

  @ApiPropertyOptional({ enum: PROBLEMI_SUCCESSIVI, description: 'Domanda 12' })
  @IsOptional()
  @IsIn(PROBLEMI_SUCCESSIVI as unknown as string[])
  problemiSuccessivi?: ProblemiSuccessivi;

  @ApiPropertyOptional({
    enum: MOTIVI,
    isArray: true,
    maxItems: MAX_MOTIVI,
    description: 'Domanda 13, massimo 2 risposte',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_MOTIVI)
  @ArrayUnique()
  @IsIn(MOTIVI as unknown as string[], { each: true })
  motivi?: Motivo[];

  @ApiPropertyOptional({
    maxLength: 300,
    description:
      'Domanda 14: testo libero soggetto a moderazione, senza dati personali non necessari',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  commento?: string;

  @ApiPropertyOptional({
    enum: LIVELLI_VERIFICA,
    default: 'V1',
    description:
      'Domanda 15. V0 = segnalazione senza esperienza personale: non accetta risposte al questionario.',
  })
  @IsOptional()
  @IsIn(LIVELLI_VERIFICA as unknown as string[])
  livelloVerifica?: LivelloVerifica;
}
