import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';
import { rateLimiter } from './middlewares/rateLimiterMiddleware';

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Aplicar rate limiter em rotas de autenticação
app.use('/api/auth', rateLimiter);

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// Rota de saúde/health
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

export default app;