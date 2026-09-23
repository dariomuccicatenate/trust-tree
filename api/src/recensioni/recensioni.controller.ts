import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UtenteAutenticato, UtenteCorrente } from '../auth/utente-corrente.decorator';
import { AggiornaRecensioneDto } from './dto/aggiorna-recensione.dto';
import { CercaRecensioniDto } from './dto/cerca-recensioni.dto';
import { CreaRecensioneDto } from './dto/crea-recensione.dto';
import { RecensioniService } from './recensioni.service';

@ApiTags('recensioni')
@Controller('recensioni')
export class RecensioniController {
  constructor(private readonly service: RecensioniService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Registra una recensione',
    description: 'Lo stesso utente puo lasciare piu recensioni allo stesso professionista.',
  })
  crea(@Body() dto: CreaRecensioneDto, @UtenteCorrente() utente: UtenteAutenticato) {
    return this.service.crea(dto, utente.id);
  }

  @Get()
  @ApiOperation({ summary: 'Elenca le recensioni, con filtri per utente, professionista e stato' })
  cerca(@Query() filtri: CercaRecensioniDto) {
    return this.service.cerca(filtri);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Dettaglio recensione con utente e professionista' })
  trova(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.trova(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Aggiorna una recensione o ne cambia lo stato',
    description: 'stato = esclusa toglie la recensione dai conteggi senza cancellarla.',
  })
  aggiorna(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AggiornaRecensioneDto,
    @UtenteCorrente() utente: UtenteAutenticato,
  ) {
    return this.service.aggiorna(id, dto, utente);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Elimina una recensione (autore o amministratore)' })
  elimina(@Param('id', ParseUUIDPipe) id: string, @UtenteCorrente() utente: UtenteAutenticato) {
    return this.service.elimina(id, utente);
  }
}
