import { startConsumer } from './consumer';

startConsumer()
  .then(() => {
    console.log('Worker consumer started');
  })
  .catch((err) => {
    console.error('Worker failed to start', err);
    process.exit(1);
  });
