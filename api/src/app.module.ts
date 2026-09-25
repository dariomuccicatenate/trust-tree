import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AreaProfessionistaModule } from './area-professionista/area-professionista.module';
import { AuthModule } from './auth/auth.module';
import { ProfessionistiModule } from './professionisti/professionisti.module';
import { PunteggiModule } from './punteggi/punteggi.module';
import { QuestionarioModule } from './questionario/questionario.module';
import { RecensioniModule } from './recensioni/recensioni.module';
import { UtentiModule } from './utenti/utenti.module';
import { VerificheModule } from './verifiche/verifiche.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DB_HOST') ?? 'localhost',
        port: Number(config.get<string>('DB_PORT') ?? 5432),
        username: config.get<string>('DB_USER') ?? 'trust',
        password: config.get<string>('DB_PASSWORD') ?? 'trust',
        database: config.get<string>('DB_NAME') ?? 'trust_tree',
        autoLoadEntities: true,
        // Lo schema e' gestito dalle migrazioni SQL nella cartella ../db.
        synchronize: false,
      }),
    }),
    AuthModule,
    UtentiModule,
    ProfessionistiModule,
    RecensioniModule,
    PunteggiModule,
    VerificheModule,
    QuestionarioModule,
    AreaProfessionistaModule,
  ],
})
export class AppModule {}
