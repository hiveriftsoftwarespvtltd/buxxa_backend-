import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';
import * as express from 'express';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Increase payload size limit to 50mb for base64 image uploads
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // Serve static assets from public/images
  app.use('/images', express.static(path.join(process.cwd(), 'public', 'images')));
  app.use('/api/images', express.static(path.join(process.cwd(), 'public', 'images')));

  // Enable Cross-Origin Resource Sharing (CORS) matching allowed origins
  app.enableCors({
    origin: '*', // Allow all origins for integration flexibility
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const port = process.env.PORT || 8009;
  await app.listen(port);
  console.log(`🚀 NestJS Backend running at http://localhost:${port}`);
}
bootstrap();
