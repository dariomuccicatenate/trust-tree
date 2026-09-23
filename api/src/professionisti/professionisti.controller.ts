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
import { CercaRecensioniDto } from '../recensioni/dto/cerca-recensioni.dto';
import { RecensioniService } from '../recensioni/recensioni.service';
import { AggiornaProfessionistaDto } from './dto/aggiorna-professionista.dto';
import { CercaProfessionistiDto } from './dto/cerca-professionisti.dto';
import { CreaProfessionistaDto } from './dto/crea-professionista.dto';
import { ProfessionistiService } from './professionisti.service';

@ApiTags('professionisti')
@Controller('professionisti')
export class ProfessionistiController {
  constructor(
    private readonly service: ProfessionistiService,
    private readonly recensioni: RecensioniService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RuoliGuard)
  @Ruoli('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registra un professionista (solo admin)' })
  crea(@Body() dto: CreaProfessionistaDto) {
    return this.service.crea(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Elenca i professionisti, con filtri per categoria e zona' })
  cerca(@Query() filtri: CercaProfessionistiDto) {
    return this.service.cerca(filtri);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Dettaglio professionista' })
  trova(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.trova(id);
  }

  @Get(':id/recensioni')
  @ApiOperation({ summary: 'Recensioni ricevute dal professionista' })
  recensioniRicevute(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() filtri: CercaRecensioniDto,
  ) {
    return this.recensioni.cerca({ ...filtri, professionistaId: id });
  }

  @Get(':id/riepilogo')
  @ApiOperation({
    summary: 'Conteggi sulle recensioni ricevute e stato rispetto alle soglie di pubblicazione',
  })
  riepilogo(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.riepilogo(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RuoliGuard)
  @Ruoli('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aggiorna un professionista (solo admin)' })
  aggiorna(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AggiornaProfessionistaDto) {
    return this.service.aggiorna(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RuoliGuard)
  @Ruoli('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Elimina un professionista e le sue recensioni (solo admin)' })
  elimina(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.elimina(id);
  }
}
