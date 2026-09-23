import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Utente } from '../utenti/utente.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RuoliGuard } from './ruoli.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Utente]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') ?? 'trust-tree-sviluppo',
        signOptions: { expiresIn: (config.get<string>('JWT_SCADENZA') ?? '12h') as any },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, RuoliGuard],
  exports: [AuthService, JwtModule, JwtAuthGuard, RuoliGuard],
})
export class AuthModule {}
