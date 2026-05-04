import { Request, Response, NextFunction } from 'express';
import { ENV } from '@/config/env';

export const BullMQBasicAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Queue Dashboard"');
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const credentials = Buffer.from(authHeader.slice(6), 'base64').toString();
  const [username, password] = credentials.split(':');

  if (
    username === ENV.BULLMQ_DASHBOARD_USERNAME &&
    password === ENV.BULLMQ_DASHBOARD_PASSWORD
  ) {
    next();
  } else {
    res.setHeader('WWW-Authenticate', 'Basic realm="Queue Dashboard"');
    res.status(401).json({ message: 'Invalid credentials' });
  }
  return;
};
