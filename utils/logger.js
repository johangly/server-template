import { createLogger, format, transports } from 'winston';

// Configurar el logger
const logger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.printf(info => `[${info.timestamp}] ${info.level}: ${info.message}`)
  ),
  transports: [
    new transports.File({
      maxsize: 5120000,
      maxFiles: 5,
      filename: 'combined.log',
      options: { flags: 'a' },
      tailable: true
    }),
    new transports.Console({
      level: 'debug',
    })
  ]

});

// Añadir un manejo de excepciones global
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection at:', error);
});

// process.on('uncaughtException', (error) => {
//   logger.error('Uncaught Exception:', error);
// });

export default logger;
