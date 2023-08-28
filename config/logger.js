import winston from 'winston';

const { combine, timestamp, printf } = winston.format;

const customFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

const options = {
  consoleDev: {
    level: 'debug',
    format: combine(timestamp(), customFormat),
    handleExceptions: true,
    json: false,
    colorize: true,
  },
  consoleProd: {
    level: 'info',
    format: combine(timestamp(), customFormat),
    handleExceptions: true,
    json: false,
    colorize: false,
  },
  fileError: {
    level: 'error',
    filename: 'errors.log',
    handleExceptions: true,
    json: true,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    colorize: false,
  },
};

const logger = winston.createLogger({
  transports: [
    process.env.NODE_ENV === 'production'
      ? new winston.transports.Console(options.consoleProd)
      : new winston.transports.Console(options.consoleDev),
    new winston.transports.File(options.fileError),
  ],
  exitOnError: false, // no se cierra en excepciones manejadas
});

export default logger;
