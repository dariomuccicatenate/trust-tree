import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Ruoli } from '../auth/ruoli.decorator';
import { RuoliGuard } from '../auth/ruoli.guard';
import { UtenteAutenticato, UtenteCorrente } from '../auth/utente-corrente.decorator';
import { AreaProfessionistaService } from './area-professionista.service';
import { AggiornaSchedaDto } from './dto/aggiorna-scheda.dto';
import { CreaContestazioneDto } from './dto/crea-contestazione.dto';

@ApiTags('area professionista')
@ApiBearerAuth()
@Controller('area-professionista')
@UseGuards(JwtAuthGuard, RuoliGuard)
@Ruoli('professionista')
export class AreaProfessionistaController {
  constructor(private readonly service: AreaProfessionistaService) {}

  @Get('cruscotto')
  @ApiOperation({
    summary: 'Scheda, punteggio e referenze ricevute dal professionista autenticato',
    description:
      'Le referenze sono anonime: il professionista ne legge il contenuto, non l’autore.',
  })
  cruscotto(@UtenteCorrente() utente: UtenteAutenticato) {
    return this.service.cruscotto(utente.id);
  }

  @Get('scheda')
  @ApiOperation({ summary: 'Dati della propria scheda pubblica' })
  mia(@UtenteCorrente() utente: UtenteAutenticato) {
    return this.service.scheda(utente.id);
  }

  @Patch('scheda')
  @ApiOperation({
    summary: 'Aggiorna contatto e zona della propria scheda',
    description:
      'Nome e categoria non sono modificabili dal professionista: restano all’amministratore.',
  })
  aggiorna(@UtenteCorrente() utente: UtenteAutenticato, @Body() dto: AggiornaSchedaDto) {
    return this.service.aggiornaScheda(utente.id, dto);
  }

  @Post('contestazioni')
  @ApiOperation({
    summary: 'Chiede all’amministratore la contestazione di una referenza ricevuta',
    description:
      'La referenza non viene modificata: resta pubblicata fino alla decisione dell’amministratore.',
  })
  contesta(@UtenteCorrente() utente: UtenteAutenticato, @Body() dto: CreaContestazioneDto) {
    return this.service.apriContestazione(utente.id, dto);
  }
}
