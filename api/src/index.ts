// ~/funnelmetrics/api/src/index.ts
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

import { startServer } from './app';

// Iniciar o servidor
startServer().catch((error) => {
  console.error('Erro ao iniciar o servidor:', error);
  process.exit(1);
});