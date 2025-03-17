import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());

// Rota básica da API
app.get('/api/health', (_, res) => {
  res.status(200).send({ status: 'ok' });
});

// Rota de teste
app.get('/api/test', (_, res) => {
  res.status(200).send({ message: 'API funcionando corretamente!' });
});

app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});
