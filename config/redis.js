import IORedis from 'ioredis';
import logger from '../utils/logger.js';

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null, // No reintentar automáticamente en el cliente
});

connection.on('connect', () => {
  logger.info('✅ Conectado a Redis');
});

connection.on('error', (err) => {
  logger.error(`❌ Error de conexión con Redis: ${err.message}`);
});

export default connection;

