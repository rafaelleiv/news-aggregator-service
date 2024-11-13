import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

/**
 * Bootstrap the NestJS application.
 *
 * This function initializes the NestJS application, sets up CORS,
 * configures Swagger documentation, and starts the server.
 */
async function bootstrap() {
  // Create the NestJS application instance
  const app = await NestFactory.create(AppModule);

  // Enable CORS with specified options
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Set a global prefix for all routes
  app.setGlobalPrefix('api/v1');

  // Configure Swagger documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle(process.env.SWAGGER_TITLE || 'Legislative News API')
    .setDescription(
      process.env.SWAGGER_DESCRIPTION ||
        'API for managing legislative news and articles',
    )
    .setVersion('1.0')
    .addTag('news', 'Operations related to legislative news')
    .addTag('cron', 'Operations for managing cron jobs')
    .build();

  // Create Swagger document and setup Swagger module
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'Legislative News API Documentation',
    customCssUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.3/swagger-ui.min.css', // Optional
  });

  // Start the server on the specified port
  const port = process.env.NEST_API_PORT || 3001;
  await app.listen(port);
  Logger.log(`🚀 Application is running on: http://localhost:${port}/api/v1`);
  Logger.log(
    `📄 Swagger documentation available at: http://localhost:${port}/docs`,
  );
}

// Call the bootstrap function and handle any errors
bootstrap().catch((err) => {
  Logger.error('❌ Error starting the server', err);
  process.exit(1);
});
