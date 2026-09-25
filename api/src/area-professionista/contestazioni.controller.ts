import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Ruoli } from '../auth/ruoli.decorator';
import { RuoliGuard } from '../auth/ruoli.guard';
import { UtenteAutenticato, UtenteCorrente } from '../auth/utente-corrente.decorator';
import { StatoContestazione } from '../common/questionario';
import { ContestazioniService } from './contestazioni.service';
import { EsitoContestazioneDto } from './dto/esito-contestazione.dto';

@ApiTags('contestazioni')
@ApiBearerAuth()
@Controller('admin/contestazioni')
@UseGuards(JwtAuthGuard, RuoliGuard)
@Ruoli('admin')
export class ContestazioniController {
  constructor(private readonly service: ContestazioniService) {}

  @Get()
  @ApiQuery({ name: 'stato', required: false, enum: ['aperta', 'accolta', 'respinta'] })
  @ApiOperation({ summary: 'Richieste di contestazione, per stato' })
  async elenco(@Query('stato') stato?: StatoContestazione) {
    const [risultati, conteggi] = await Promise.all([
      this.service.elenco(stato ?? 'aperta'),
      this.service.conteggi(),
    ]);
    return { totale: risultati.length, conteggi, risultati };
  }

  @Post(':id/accogli')
  @ApiOperation({
    summary: 'Accoglie la richiesta: la referenza viene esclusa dal calcolo dei punteggi',
  })
  accogli(
    @Param('id', ParseUUIDPipe) id: string,
    @UtenteCorrente() admin: UtenteAutenticato,
    @Body() dto: EsitoContestazioneDto,
  ) {
    return this.service.accogli(id, admin.id, dto.note);
  }

  @Post(':id/respingi')
  @ApiOperation({ summary: 'Respinge la richiesta: la referenza resta pubblicata' })
  respingi(
    @Param('id', ParseUUIDPipe) id: string,
    @UtenteCorrente() admin: UtenteAutenticato,
    @Body() dto: EsitoContestazioneDto,
  ) {
    return this.service.respingi(id, admin.id, dto.note);
  }
}
