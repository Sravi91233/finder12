// A simple logger utility.
// In a production environment, you would integrate with a full-featured logging service.

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

const log = (level: LogLevel, message: string, data?: unknown) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    data,
  };

  switch (level) {
    case 'INFO':
      console.info(JSON.stringify(logEntry, null, 2));
      break;
    case 'WARN':
      console.warn(JSON.stringify(logEntry, null, 2));
      break;
    case 'ERROR':
      console.error(JSON.stringify(logEntry, null, 2));
      break;
    case 'DEBUG':
      // Debug logs will only show up in development, not production.
      if (process.env.NODE_ENV === 'development') {
        console.debug(JSON.stringify(logEntry, null, 2));
      }
      break;
  }
};

export const logger = {
  info: (message: string, data?: unknown) => log('INFO', message, data),
  warn: (message: string, data?: unknown) => log('WARN', message, data),
  error: (message: string, data?: unknown) => log('ERROR', message, data),
  debug: (message: string, data?: unknown) => log('DEBUG', message, data),
};
