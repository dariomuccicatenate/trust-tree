import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Ruoli } from '../auth/ruoli.decorator';
import { RuoliGuard } from '../auth/ruoli.guard';
import { UtenteAutenticato, UtenteCorrente } from '../auth/utente-corrente.decorator';
import { StatoDocumento } from '../common/questionario';
import { opzioniUpload } from './documenti.config';
import { EsitoVerificaDto } from './dto/esito-verifica.dto';
import { VerificheService } from './verifiche.service';

@ApiTags('verifiche')
@ApiBearerAuth()
@Controller()
export class VerificheController {
  constructor(private readonly service: VerificheService) {}

  @Post('recensioni/:id/documento')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('documento', opzioniUpload))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Allega alla propria referenza un preventivo, una fattura o una ricevuta',
    description:
      'Il file resta privato e va in coda di verifica. Ammessi PDF, JPEG, PNG e WebP fino a 5 MB.',
  })
  allega(
    @Param('id', ParseUUIDPipe) id: string,
    @UtenteCorrente() utente: UtenteAutenticato,
    @UploadedFile() documento: Express.Multer.File,
  ) {
    return this.service.allega(id, utente.id, documento);
  }

  @Get('admin/verifiche')
  @UseGuards(JwtAuthGuard, RuoliGuard)
  @Ruoli('admin')
  @ApiQuery({ name: 'stato', required: false, enum: ['in_attesa', 'approvato', 'rifiutato'] })
  @ApiOperation({ summary: 'Documenti caricati, per stato di verifica' })
  async elenco(@Query('stato') stato?: StatoDocumento) {
    const [risultati, conteggi] = await Promise.all([
      this.service.elenco(stato ?? 'in_attesa'),
      this.service.conteggi(),
    ]);
    return { totale: risultati.length, conteggi, risultati };
  }

  @Get('admin/verifiche/:id/documento')
  @UseGuards(JwtAuthGuard, RuoliGuard)
  @Ruoli('admin')
  @ApiOperation({ summary: 'Scarica il documento allegato (riservato all’amministratore)' })
  async scarica(@Param('id', ParseUUIDPipe) id: string, @Res() risposta: Response) {
    const documento = await this.service.documento(id);
    risposta.setHeader('Content-Type', documento.mime);
    risposta.setHeader('Content-Disposition', `inline; filename="${documento.nome}"`);
    risposta.sendFile(documento.percorso);
  }

  @Post('admin/verifiche/:id/approva')
  @UseGuards(JwtAuthGuard, RuoliGuard)
  @Ruoli('admin')
  @ApiOperation({ summary: 'Approva il documento: la referenza passa a V2 verificata' })
  approva(
    @Param('id', ParseUUIDPipe) id: string,
    @UtenteCorrente() admin: UtenteAutenticato,
    @Body() dto: EsitoVerificaDto,
  ) {
    return this.service.approva(id, admin.id, dto.note);
  }

  @Post('admin/verifiche/:id/rifiuta')
  @UseGuards(JwtAuthGuard, RuoliGuard)
  @Ruoli('admin')
  @ApiOperation({ summary: 'Rifiuta il documento: la referenza torna a V1 dichiarata' })
  rifiuta(
    @Param('id', ParseUUIDPipe) id: string,
    @UtenteCorrente() admin: UtenteAutenticato,
    @Body() dto: EsitoVerificaDto,
  ) {
    return this.service.rifiuta(id, admin.id, dto.note);
  }
}
