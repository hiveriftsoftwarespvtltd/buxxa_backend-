import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
