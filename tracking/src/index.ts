import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createClient } from '@clickhouse/client';

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());

// Configuração do ClickHouse (comentada até estar pronta para uso)
/*
const clickhouse = createClient({
  host: process.env.CLICKHOUSE_HOST || 'http://localhost:8123',
  username: process.env.CLICKHOUSE_USER || 'default',
  password: process.env.CLICKHOUSE_PASSWORD || '',
  database: process.env.CLICKHOUSE_DB || 'tracking'
});
*/

// Rota básica de tracking
app.post('/track', (req, res) => {
  console.log('Evento recebido:', req.body);
  // Aqui implementaremos o processamento real do evento
  res.status(200).send({ status: 'success' });
});

// Rota de healthcheck
app.get('/health', (_, res) => {
  res.status(200).send({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Serviço de tracking rodando na porta ${PORT}`);
});
