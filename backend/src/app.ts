import './config/env.js';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import businessRoutes from './routes/business.routes.js';
import appointmentRoutes from './routes/appointment.routes.js';
import servicesRoutes from './routes/services.routes.js';
import chatRoutes from './routes/chat.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/logger.js';

const app = express();

// Render (and other reverse proxies) set X-Forwarded-For; required for rate limiting
app.set('trust proxy', 1);

const normalizeOrigin = (url: string): string => url.replace(/\/$/, '');

const allowedOrigins = new Set(
  [process.env.FRONTEND_URL, 'http://localhost:3000', 'http://127.0.0.1:3000']
    .filter(Boolean)
    .map((origin) => normalizeOrigin(origin as string)),
);

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser clients (curl, health checks) with no Origin header
      if (!origin || allowedOrigins.has(normalizeOrigin(origin))) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked origin: ${origin}`));
    },
  }),
);
app.use(requestLogger);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/chat', chatRoutes);

app.use((_req, res) => {
  res.status(404).json({
    error: { message: 'Not found', code: 'NOT_FOUND' },
  });
});

app.use(errorHandler);

export default app;
