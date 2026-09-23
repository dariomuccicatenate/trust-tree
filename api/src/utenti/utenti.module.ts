import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Utente } from './utente.entity';
import { UtentiController } from './utenti.controller';
import { UtentiService } from './utenti.service';

@Module({
  imports: [TypeOrmModule.forFeature([Utente]), AuthModule],
  controllers: [UtentiController],
  providers: [UtentiService],
  exports: [UtentiService],
})
export class UtentiModule {}
