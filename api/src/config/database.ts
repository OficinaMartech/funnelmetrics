// ~/funnelmetrics/api/src/config/database.ts
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Criar instância do Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME || 'funnelmetrics',
  process.env.DB_USER || 'funneluser',
  process.env.DB_PASSWORD || 'senha_forte_db',
  {
    host: process.env.DB_HOST || 'postgres',
    port: Number(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    // Configurações adicionais para produção
    dialectOptions: process.env.NODE_ENV === 'production' 
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false, // Usar apenas se o certificado SSL não for verificável
          }
        } 
      : {},
  }
);

// Função para inicializar o banco de dados
export const initializeDatabase = async (): Promise<void> => {
  try {
    // Testar a conexão
    await sequelize.authenticate();
    console.log('Conexão com o banco de dados estabelecida com sucesso.');
    
    // Sincronizar modelos com o banco de dados
    // Em produção, é recomendável usar migrations em vez de sync
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
      console.log('Modelos sincronizados com o banco de dados.');
    }
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error);
    throw error;
  }
};

export default sequelize;