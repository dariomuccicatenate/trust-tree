import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Professionista } from '../professionisti/professionista.entity';
import { Recensione } from '../recensioni/recensione.entity';
import { Utente } from '../utenti/utente.entity';
import { PunteggiController } from './punteggi.controller';
import { RicercaService } from './ricerca.service';
import { TrustRelevanceService } from './trust-relevance.service';
import { TrustScoreService } from './trust-score.service';

@Module({
  imports: [TypeOrmModule.forFeature([Recensione, Professionista, Utente]), AuthModule],
  controllers: [PunteggiController],
  providers: [TrustScoreService, TrustRelevanceService, RicercaService],
  exports: [TrustScoreService, TrustRelevanceService],
})
export class PunteggiModule {}
