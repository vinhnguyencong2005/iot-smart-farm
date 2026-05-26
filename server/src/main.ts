import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('IoT Smart Farm API')
    .setDescription('The backend API for managing ESP32 IoT Nodes')
    .setVersion('1.0')
    .addTag('Device')
    .addTag('Irrigation')
    .addTag('Analytic')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // This exposes the UI at http://localhost:3000/api-docs
  SwaggerModule.setup('api-docs', app, document, {
    jsonDocumentUrl: 'api-docs/swagger.json',
  });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
