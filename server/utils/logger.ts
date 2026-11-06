// ========================================================================
// SW Service Desk v1.0 - Logger Estruturado em JSON
// Empresa: SW Cloud Solutions
// ========================================================================

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
  };
}

function writeLog(level: LogLevel, message: string, context?: Record<string, any>, err?: any) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
  };

  if (err instanceof Error) {
    entry.error = {
      message: err.message,
      stack: err.stack,
    };
  } else if (err) {
    entry.error = { message: String(err) };
  }

  const jsonStr = JSON.stringify(entry);
  if (level === 'ERROR') {
    console.error(jsonStr);
  } else if (level === 'WARN') {
    console.warn(jsonStr);
  } else {
    console.log(jsonStr);
  }
}

export const logger = {
  debug: (message: string, context?: Record<string, any>) => writeLog('DEBUG', message, context),
  info: (message: string, context?: Record<string, any>) => writeLog('INFO', message, context),
  warn: (message: string, context?: Record<string, any>, err?: any) => writeLog('WARN', message, context, err),
  error: (message: string, context?: Record<string, any>, err?: any) => writeLog('ERROR', message, context, err),
};
