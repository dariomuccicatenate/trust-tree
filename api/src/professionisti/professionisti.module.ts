import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Recensione } from '../recensioni/recensione.entity';
import { RecensioniModule } from '../recensioni/recensioni.module';
import { Professionista } from './professionista.entity';
import { ProfessionistiController } from './professionisti.controller';
import { ProfessionistiService } from './professionisti.service';

@Module({
  imports: [TypeOrmModule.forFeature([Professionista, Recensione]), RecensioniModule, AuthModule],
  controllers: [ProfessionistiController],
  providers: [ProfessionistiService],
  exports: [ProfessionistiService],
})
export class ProfessionistiModule {}
