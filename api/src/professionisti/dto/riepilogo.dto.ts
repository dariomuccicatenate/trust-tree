import { ApiProperty } from '@nestjs/swagger';

/**
 * Conteggi grezzi sulle recensioni di un professionista.
 * Non contiene il Trust Score: qui vengono esposti solo i dati raccolti.
 */
export class RiepilogoProfessionistaDto {
  @ApiProperty({ format: 'uuid' })
  professionistaId: string;

  @ApiProperty({ description: 'Recensioni pubblicate con esperienza personale (livello V1-V3)' })
  esperienzeValide: number;

  @ApiProperty({ description: 'Utenti distinti che hanno lasciato una esperienza valida' })
  referentiDistinti: number;

  @ApiProperty({ description: 'Recensioni di livello V0: segnalazioni senza valore reputazionale' })
  segnalazioni: number;

  @ApiProperty({
    description:
      'true finche\u0301 non sono raggiunte le soglie minime (5 esperienze valide da 3 utenti distinti)',
  })
  reputazioneInCostruzione: boolean;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' } })
  perLivelloVerifica: Record<string, number>;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' } })
  consiglierebbe: Record<string, number>;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' } })
  richiamerebbe: Record<string, number>;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' } })
  qualita: Record<string, number>;

  @ApiProperty({ type: [String], description: 'Motivi piu\u0300 indicati, in ordine di frequenza' })
  motiviPrincipali: string[];
}
