// ~/funnelmetrics/api/src/app.ts
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import sequelize from './config/database';
import authRoutes from './routes/authRoutes';

// Inicializar Express
const app: Application = express();

// Middlewares
app.use(helmet()); // Ajuda na segurança da aplicação
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parsing de JSON
app.use(cookieParser()); // Parsing de cookies

// Configuração de CORS ok
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true, // Permite cookies em requisições cross-origin
  })
);

// Rotas
app.use('/api/auth', authRoutes);

// Rota de teste
app.get('/api/health', (_, res) => {
  res.status(200).send({ status: 'ok' });
});

// Sincronizar o modelo com o banco de dados
const syncDatabase = async (): Promise<void> => {
  try {
    await sequelize.sync({ alter: true });
    console.log('Banco de dados sincronizado com sucesso');
  } catch (error) {
    console.error('Erro ao sincronizar banco de dados:', error);
  }
};

// Inicializar servidor
const PORT = process.env.PORT || 4000;

const startServer = async (): Promise<void> => {
  await syncDatabase();
  
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
};

export { app, startServer };