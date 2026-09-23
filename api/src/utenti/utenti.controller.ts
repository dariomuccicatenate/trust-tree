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
import { Ruoli } from '../auth/ruoli.decorator';
import { RuoliGuard } from '../auth/ruoli.guard';
import { AggiornaUtenteDto } from './dto/aggiorna-utente.dto';
import { CercaUtentiDto } from './dto/cerca-utenti.dto';
import { CreaUtenteDto } from './dto/crea-utente.dto';
import { UtentiService } from './utenti.service';

@ApiTags('utenti')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RuoliGuard)
@Ruoli('admin')
@Controller('utenti')
export class UtentiController {
  constructor(private readonly service: UtentiService) {}

  @Post()
  @ApiOperation({ summary: 'Registra un utente' })
  crea(@Body() dto: CreaUtenteDto) {
    return this.service.crea(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Elenca gli utenti, con filtri per email e zona' })
  cerca(@Query() filtri: CercaUtentiDto) {
    return this.service.cerca(filtri);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Dettaglio utente' })
  trova(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.trova(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Aggiorna un utente' })
  aggiorna(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AggiornaUtenteDto) {
    return this.service.aggiorna(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina un utente e le sue recensioni' })
  elimina(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.elimina(id);
  }
}
