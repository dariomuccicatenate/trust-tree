import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Professionista } from '../professionisti/professionista.entity';
import { Utente } from '../utenti/utente.entity';
import { Recensione } from './recensione.entity';
import { RecensioniController } from './recensioni.controller';
import { RecensioniService } from './recensioni.service';

@Module({
  imports: [TypeOrmModule.forFeature([Recensione, Utente, Professionista]), AuthModule],
  controllers: [RecensioniController],
  providers: [RecensioniService],
  exports: [RecensioniService],
})
export class RecensioniModule {}
