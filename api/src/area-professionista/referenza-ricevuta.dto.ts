import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  LIVELLI_VERIFICA,
  LivelloVerifica,
  MOTIVI_CONTESTAZIONE,
  MotivoContestazione,
  STATI_CONTESTAZIONE,
  STATI_RECENSIONE,
  StatoContestazione,
  StatoRecensione,
} from '../common/questionario';
import { Recensione } from '../recensioni/recensione.entity';

/**
 * Referenza come la vede il professionista.
 *
 * L'identita' di chi ha scritto la referenza non viene esposta: il professionista legge
 * il contenuto e puo' contestarlo, ma non sa a quale vicino attribuirlo. Lo stesso vale
 * per il condominio e per la zona del referente, che renderebbero l'autore riconoscibile
 * in un palazzo di poche famiglie.
 */
export class ReferenzaRicevutaDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  categoriaServizio: string;

  @ApiPropertyOptional()
  descrizioneLavoro: string | null;

  @ApiProperty()
  periodoUtilizzo: string;

  @ApiPropertyOptional()
  fasciaImporto: string | null;

  @ApiPropertyOptional()
  puntualita: string | null;

  @ApiPropertyOptional()
  rispettoPrezzo: string | null;

  @ApiPropertyOptional()
  completamento: string | null;

  @ApiPropertyOptional()
  qualita: string | null;

  @ApiPropertyOptional()
  correttezza: string | null;

  @ApiPropertyOptional()
  richiamerebbe: string | null;

  @ApiPropertyOptional()
  consiglierebbe: string | null;

  @ApiPropertyOptional()
  problemiSuccessivi: string | null;

  @ApiProperty({ isArray: true, type: String })
  motivi: string[];

  @ApiPropertyOptional()
  commento: string | null;

  @ApiProperty({ enum: LIVELLI_VERIFICA })
  livelloVerifica: LivelloVerifica;

  @ApiProperty({ enum: STATI_RECENSIONE })
  stato: StatoRecensione;

  @ApiProperty()
  creatoIl: Date;

  @ApiProperty({ enum: STATI_CONTESTAZIONE })
  contestazioneStato: StatoContestazione;

  @ApiPropertyOptional({ enum: MOTIVI_CONTESTAZIONE })
  contestazioneMotivo: MotivoContestazione | null;

  @ApiPropertyOptional()
  contestazioneDettaglio: string | null;

  @ApiPropertyOptional()
  contestazioneApertaIl: Date | null;

  @ApiPropertyOptional()
  contestazioneDecisaIl: Date | null;

  @ApiPropertyOptional({ description: 'Motivazione della decisione dell’amministratore' })
  contestazioneNoteEsito: string | null;

  /** Vero se la referenza concorre ai punteggi. */
  @ApiProperty()
  concorreAiPunteggi: boolean;

  static da(recensione: Recensione): ReferenzaRicevutaDto {
    return {
      id: recensione.id,
      categoriaServizio: recensione.categoriaServizio,
      descrizioneLavoro: recensione.descrizioneLavoro,
      periodoUtilizzo: recensione.periodoUtilizzo,
      fasciaImporto: recensione.fasciaImporto,
      puntualita: recensione.puntualita,
      rispettoPrezzo: recensione.rispettoPrezzo,
      completamento: recensione.completamento,
      qualita: recensione.qualita,
      correttezza: recensione.correttezza,
      richiamerebbe: recensione.richiamerebbe,
      consiglierebbe: recensione.consiglierebbe,
      problemiSuccessivi: recensione.problemiSuccessivi,
      motivi: recensione.motivi ?? [],
      commento: recensione.commento,
      livelloVerifica: recensione.livelloVerifica,
      stato: recensione.stato,
      creatoIl: recensione.creatoIl,
      contestazioneStato: recensione.contestazioneStato,
      contestazioneMotivo: recensione.contestazioneMotivo,
      contestazioneDettaglio: recensione.contestazioneDettaglio,
      contestazioneApertaIl: recensione.contestazioneApertaIl,
      contestazioneDecisaIl: recensione.contestazioneDecisaIl,
      contestazioneNoteEsito: recensione.contestazioneNoteEsito,
      concorreAiPunteggi: recensione.stato === 'pubblicata' && recensione.livelloVerifica !== 'V0',
    };
  }
}
