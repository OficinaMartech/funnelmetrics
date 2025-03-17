// ~/funnelmetrics/api/src/config/database.ts
import { Sequelize } from 'sequelize';

const sequelize = new Sequelize(
  process.env.DB_NAME || 'funnelmetrics',
  process.env.DB_USER || 'funneluser',
  process.env.DB_PASSWORD || 'funnelpassword',
  {
    host: process.env.DB_HOST || 'postgres',
    dialect: 'postgres',
    logging: process.env.NODE_ENV !== 'production' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

export default sequelize;