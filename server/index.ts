import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { registerRoutes } from './routes';
import { setupVite } from './vite';
import 'dotenv/config';

async function main() {
  const app = express();
  const port = process.env.PORT || 5000;

  // Middleware
  app.use(cors());
  app.use(bodyParser.json());

  // Security middleware
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // Create HTTP server
  const server = createServer(app);

  // Development middleware
  if (process.env.NODE_ENV === 'development') {
    await setupVite(app, server);
  }

  // Register routes
  await registerRoutes(app, server);

  // Error handling
  app.use((err: any, req: any, res: any, next: any) => {
    console.error(err.stack);
    
    // Handle specific error types
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: err.errors
      });
    }
    
    if (err.name === 'UnauthorizedError') {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Generic error response
    res.status(err.status || 500).json({ 
      success: false, 
      message: err.message || 'An unexpected error occurred',
      code: err.code
    });
  });

  // Start server
  server.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
  });
}

main().catch(console.error);
