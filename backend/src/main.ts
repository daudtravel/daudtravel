import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { json, urlencoded, raw } from 'express';
import cookieParser from 'cookie-parser';
import { getAllFrontendUrls } from './common/utils/frontend-url.util';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  app.use(
    '/api/tours/payments/bog/callback',
    raw({ type: 'application/json' }),
  );
  app.use(
    '/api/transfer/payments/bog/callback',
    raw({ type: 'application/json' }),
  );
  app.use('/api/quick-payment/bog/callback', raw({ type: 'application/json' }));
  app.use('/api/insurance/bog/callback', raw({ type: 'application/json' }));

  app.use(json({ limit: '100mb' }));
  app.use(urlencoded({ extended: true, limit: '100mb' }));
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const frontendUrls = getAllFrontendUrls();

  const corsOptions = {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) {
        return callback(null, true);
      }

      if (frontendUrls.includes(origin)) {
        callback(null, true);
      } else {
        console.warn('Blocked CORS request from origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'callback-signature',
    ],
    exposedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 86400,
  };

  app.enableCors(corsOptions);

  const config = new DocumentBuilder()
    .setTitle('Daud Travel API')
    .setDescription(
      'API documentation for Daud Travel with authentication and payments',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addCookieAuth('refreshToken', {
      type: 'apiKey',
      in: 'cookie',
      name: 'refreshToken',
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: 'Daud Travel API Docs',
    customCss: '.swagger-ui .topbar { display: none }',
    customfavIcon: '/uploads/favicon.ico',
    customCssUrl: undefined,
    customJs: undefined,
    swaggerUrl: undefined,
  });

  const PORT = process.env.PORT || 4000;

  const gracefulShutdown = async (signal: string) => {
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  await app.listen(PORT, '0.0.0.0');
}

bootstrap();
