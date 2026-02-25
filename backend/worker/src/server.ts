import { startConsumer } from './consumer';
import { logger } from './infrastructure/logger';

startConsumer()
  .then(() => {
    logger.info('worker_started');
  })
  .catch((err) => {
    logger.error('worker_start_failed', { err });
    process.exit(1);
  });
