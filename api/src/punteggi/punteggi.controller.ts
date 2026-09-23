import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UtenteAutenticato, UtenteCorrente } from '../auth/utente-corrente.decorator';
import { RicercaService } from './ricerca.service';
import { TrustRelevanceService } from './trust-relevance.service';
import { TrustScoreService } from './trust-score.service';

@ApiTags('punteggi')
@Controller()
export class PunteggiController {
  constructor(
    private readonly trustScore: TrustScoreService,
    private readonly trustRelevance: TrustRelevanceService,
    private readonly ricerca: RicercaService,
  ) {}

  @Get('professionisti/:id/trust-score')
  @ApiOperation({
    summary: 'Trust Score del professionista, con le componenti e i pesi applicati',
  })
  punteggio(@Param('id', ParseUUIDPipe) id: string) {
    return this.trustScore.perProfessionista(id);
  }

  @Get('professionisti/:id/trust-relevance')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'servizio', required: false })
  @ApiOperation({ summary: 'Trust Relevance calcolata per l\u2019utente autenticato' })
  rilevanza(
    @Param('id', ParseUUIDPipe) id: string,
    @UtenteCorrente() utente: UtenteAutenticato,
    @Query('servizio') servizio?: string,
  ) {
    return this.trustRelevance.perProfessionista(id, utente.id, servizio ?? '');
  }

  @Get('ricerca')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'testo', required: false })
  @ApiQuery({ name: 'categoria', required: false })
  @ApiQuery({ name: 'zona', required: false })
  @ApiOperation({
    summary:
      'Professionisti con Trust Score, Trust Relevance e ordinamento 0,6 TS + 0,4 TR',
  })
  cerca(
    @UtenteCorrente() utente: UtenteAutenticato,
    @Query('testo') testo?: string,
    @Query('categoria') categoria?: string,
    @Query('zona') zona?: string,
  ) {
    return this.ricerca.cerca(utente.id, { testo, categoria, zona });
  }
}
