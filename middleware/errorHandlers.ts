import type { Request, Response, NextFunction } from 'express';

export function notFound(req: Request, res: Response): void {
  res.status(404).json({ error: `Not Found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(
  err: Error & { status?: number; statusCode?: number; type?: string },
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Raised by express.json() when the request body is not valid JSON.
  if (err.type === 'entity.parse.failed') {
    res.status(400).json({ error: `Malformed JSON in request body: ${err.message}` });
    return;
  }

  // Mongoose CastError (e.g. a malformed ObjectId that slipped past validation) is a client error.
  const status = err.name === 'CastError' ? 400 : err.status ?? err.statusCode ?? 500;

  if (status >= 500) {
    console.error('[error]', err);
  }

  const exposeMessage = status < 500 || process.env.NODE_ENV !== 'production';
  res.status(status).json({
    error: exposeMessage ? err.message || 'Internal Server Error' : 'Internal Server Error',
  });
}
