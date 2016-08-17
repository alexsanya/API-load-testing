const q = require('./node_modules/q');
const uid = require('./node_modules/uid');
const restify = require('./node_modules/restify');
const throng = require('./node_modules/throng');
const simpleNodeLogger = require('./node_modules/simple-node-logger');
const faker = require('./node_modules/faker');
const kue = require('./node_modules/kue');
const signUp = require('../lib/staffAPI').signUp;
const getStaffApiByToken = require('../lib/staffAPI').getStaffApiByToken;
const WorkerCreator = require('./workerCreator');
const createRequestStats = require('../lib/requestStats').create;
const createContentProvider = require('../lib/contentProvider').create;
const getMessageQueue = require('../lib/messageQueue');
const WorkerLogger = require('../lib/workerLogger');
const config = require('./config');

function start(workerId) {
  const log = simpleNodeLogger.createSimpleLogger();
  log.setLevel('info');
  const logger = new WorkerLogger(workerId, log);

  logger.info(`process started with pid: ${process.pid}`);

  const messageQueue = getMessageQueue(kue);
  const contentProvider = createContentProvider(faker, config.auth);

  const requestStatsParams = {
    slowRequestMs: config.slowRequestMs,
    avgInfoIntervalMs: config.avgInfoIntervalMs,
    onSlowRequest: (info, time) => {
      logger.warn(`slow request captured time: ${time}ms`, info);
      messageQueue.push('slowRequest', {
        info,
        workerId,
        time,
        workerType: 'creator',
      });
    },
    onAvgResponceInfo: (info) => {
      messageQueue.push('statsData', {
        info,
        workerId,
        workerType: 'creator',
      });
    },
  };

  let worker;
  const requestStats = createRequestStats(q, uid, requestStatsParams);

  signUp(q, requestStats, contentProvider, restify, config.apiUrl).then((data) => {
    logger.info('authorized');

    messageQueue.push('authentification', {
      token: data.token,
    });
    const staffApi =
      getStaffApiByToken(q, requestStats, contentProvider, restify, config.apiUrl, data.token);
    worker = new WorkerCreator(messageQueue, staffApi, q, logger);
    worker.beginWork();
  }).catch((err) => {
    logger.error('Error during sign up', err);
  });

  process.on('SIGTERM', () => {
    logger.info('termination started...');
    worker.terminate().then(() => {
      logger.info('terminated');
      process.exit();
    });
  });
}

throng({
  start,
  workers: config.concurrency,
});
