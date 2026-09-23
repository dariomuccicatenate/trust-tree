import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegistrazioneDto } from './dto/registrazione.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UtenteAutenticato, UtenteCorrente } from './utente-corrente.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accesso con email e password, restituisce un token JWT' })
  login(@Body() dto: LoginDto) {
    return this.service.login(dto.email, dto.password);
  }

  @Post('registrazione')
  @ApiOperation({
    summary: 'Crea un account e restituisce subito il token',
    description: 'La registrazione crea sempre un utente con ruolo "utente".',
  })
  registra(@Body() dto: RegistrazioneDto) {
    return this.service.registra(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Profilo dell\u2019utente autenticato' })
  me(@UtenteCorrente() utente: UtenteAutenticato) {
    return this.service.profilo(utente.id);
  }
}
