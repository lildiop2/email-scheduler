import fs from 'fs';
import path from 'path';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const { combine, timestamp, errors, json } = winston.format;

const LOG_BASE_DIR = process.env.LOG_DIR ?? path.join(process.cwd(), 'logs');
const LOG_DIR = path.join(LOG_BASE_DIR, 'worker');
fs.mkdirSync(LOG_DIR, { recursive: true });

const baseFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  format: baseFormat,
  defaultMeta: {
    service: 'email-scheduler-worker',
    pid: process.pid
  },
  transports: [
    new winston.transports.Console({
      format: baseFormat
    }),
    new DailyRotateFile({
      dirname: LOG_DIR,
      filename: '%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d'
    }),
    new DailyRotateFile({
      dirname: LOG_DIR,
      filename: '%DATE%.error.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error'
    })
  ]
});
