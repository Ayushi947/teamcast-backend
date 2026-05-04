import helmet from 'helmet';
import { Express, Request, Response, NextFunction } from 'express';
import { ENV } from '@/config/env';
import crypto from 'crypto';

// Middleware to generate CSP nonce
export const generateNonce = (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  // Generate a random nonce for each request
  const nonce = crypto.randomBytes(16).toString('base64');
  res.locals.cspNonce = nonce;
  next();
};

export const setupSecurityHeaders = (app: Express) => {
  // Remove the X-Powered-By header to avoid exposing the technology stack
  app.disable('x-powered-by');

  // Configure Helmet middleware with comprehensive security headers
  app.use(
    helmet({
      // Content Security Policy (CSP) - Controls which resources can be loaded
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"], // Only allow resources from same origin
          scriptSrc: [
            "'self'",
            // Only allow unsafe-inline and unsafe-eval for Swagger UI routes
            // For production, consider hosting Swagger UI assets locally
            ...(ENV.NODE_ENV === 'development'
              ? ["'unsafe-inline'", "'unsafe-eval'"]
              : []),
            // In production, use nonce-based approach
            (_req, res) => `'nonce-${(res as any).locals.cspNonce}'`,
          ],
          styleSrc: [
            "'self'",
            // Allow inline styles only in development
            ...(ENV.NODE_ENV === 'development' ? ["'unsafe-inline'"] : []),
            // In production, use nonce for inline styles
            (_req, res) => `'nonce-${(res as any).locals.cspNonce}'`,
            // Allow specific CDNs for external styles if needed
            'https://fonts.googleapis.com',
          ],
          imgSrc: ["'self'", 'data:', 'https:'], // Allow images from same origin, data URIs, and HTTPS
          connectSrc: [
            "'self'",
            'https://teamcast.ai',
            'https://www.teamcast.ai',
            ENV.FRONTEND_URL,
          ], // Allow API calls to same origin and frontend
          fontSrc: ["'self'", 'https:', 'data:'], // Allow fonts from same origin, HTTPS, and data URIs
          objectSrc: ["'none'"], // Block <object>, <embed>, and <applet> elements
          mediaSrc: ["'none'"], // Block media elements
          frameSrc: ["'none'"], // Block iframes
          frameAncestors: ["'none'"], // Prevent site from being embedded
          formAction: ["'self'"], // Only allow forms to submit to same origin
          ...(ENV.NODE_ENV === 'production'
            ? {
                upgradeInsecureRequests: [], // Force HTTPS in production
                blockAllMixedContent: [], // Block mixed content in production
              }
            : {}),
        },
      },
      // Cross-Origin Policies
      crossOriginEmbedderPolicy: false, // Required for Swagger UI
      crossOriginOpenerPolicy: { policy: 'same-origin' }, // Isolate cross-origin windows
      crossOriginResourcePolicy: { policy: 'same-origin' }, // Restrict cross-origin resource sharing

      // Browser Feature Policies
      dnsPrefetchControl: { allow: false }, // Disable DNS prefetching
      frameguard: { action: 'deny' }, // Prevent clickjacking
      hsts: {
        // HTTP Strict Transport Security
        maxAge: 31536000, // 1 year in seconds
        includeSubDomains: true, // Apply to subdomains
        preload: true, // Allow preloading HSTS
      },
      ieNoOpen: true, // Prevent IE from executing downloads
      noSniff: true, // Prevent MIME type sniffing
      originAgentCluster: true, // Improve performance isolation
      permittedCrossDomainPolicies: { permittedPolicies: 'none' }, // Restrict Adobe Flash and PDFs
      referrerPolicy: { policy: 'no-referrer' }, // Control referrer information
      xssFilter: true, // Enable XSS filtering
    })
  );

  // Additional custom security headers
  app.use((_req, res, next) => {
    // Restrict browser features and APIs
    res.setHeader(
      'Permissions-Policy',
      'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
    );
    res.setHeader('X-Content-Type-Options', 'nosniff'); // Prevent MIME type sniffing
    res.setHeader('X-Frame-Options', 'DENY'); // Prevent clickjacking
    res.setHeader('X-XSS-Protection', '1; mode=block'); // Enable XSS protection
    next();
  });

  // Note: CORS configuration is handled by corsMiddleware in app.ts
  // Removed duplicate CORS logic to prevent conflicts
};
