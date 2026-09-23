import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { preparaCartella } from './verifiche/documenti.config';

async function bootstrap() {
  preparaCartella();

  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const documento = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Trust Tree API')
      .setDescription('Utenti, professionisti e recensioni della rete di fiducia professionale')
      .setVersion('1.0')
      .addBearerAuth()
      .build(),
  );
  SwaggerModule.setup('api/docs', app, documento);

  const porta = Number(process.env.PORT ?? 3000);
  await app.listen(porta);
  console.log(`API in ascolto su http://localhost:${porta}/api (docs: /api/docs)`);
}

bootstrap();
