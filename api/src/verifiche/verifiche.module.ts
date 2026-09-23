import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Recensione } from '../recensioni/recensione.entity';
import { VerificheController } from './verifiche.controller';
import { VerificheService } from './verifiche.service';

@Module({
  imports: [TypeOrmModule.forFeature([Recensione]), AuthModule],
  controllers: [VerificheController],
  providers: [VerificheService],
  exports: [VerificheService],
})
export class VerificheModule {}
