import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import authRoutes from './routes/authRoutes.js';
import itemRoutes from './routes/itemRoutes.js';
import { notFound, errorHandler } from './middleware/errorHandlers.js';

export function createApp(): Express {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(cors());
  app.use(express.json({ limit: '100kb' }));

  app.get('/healthz', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: "Fran's Campus Lost & Found API",
      author: 'Francis Torres (301530008)',
      status: 'running',
      docs: '/api/docs',
      openapi: '/api/docs.json',
      endpoints: {
        auth: ['POST /api/auth/signup', 'POST /api/auth/signin', 'GET /api/auth/me'],
        items: [
          'GET    /api/items',
          'GET    /api/items/mine',
          'GET    /api/items/:id',
          'POST   /api/items',
          'PUT    /api/items/:id',
          'DELETE /api/items/mine',
          'DELETE /api/items/:id',
        ],
      },
    });
  });

  app.get('/api/docs.json', (_req: Request, res: Response) => {
    res.json(swaggerSpec);
  });
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customSiteTitle: "Fran's Campus Lost & Found API Docs",
    })
  );

  app.use('/api/auth', authRoutes);
  app.use('/api/items', itemRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
