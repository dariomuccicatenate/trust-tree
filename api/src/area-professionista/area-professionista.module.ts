import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Professionista } from '../professionisti/professionista.entity';
import { ProfessionistiModule } from '../professionisti/professionisti.module';
import { PunteggiModule } from '../punteggi/punteggi.module';
import { Recensione } from '../recensioni/recensione.entity';
import { AreaProfessionistaController } from './area-professionista.controller';
import { AreaProfessionistaService } from './area-professionista.service';
import { ContestazioniController } from './contestazioni.controller';
import { ContestazioniService } from './contestazioni.service';

/**
 * Area del professionista (referenze ricevute, richiesta di contestazione) e
 * decisione delle contestazioni da parte dell'amministratore.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Professionista, Recensione]),
    AuthModule,
    ProfessionistiModule,
    PunteggiModule,
  ],
  controllers: [AreaProfessionistaController, ContestazioniController],
  providers: [AreaProfessionistaService, ContestazioniService],
})
export class AreaProfessionistaModule {}
