const q = require('./node_modules/q');
const uid = require('./node_modules/uid');
const restify = require('./node_modules/restify');
const throng = require('./node_modules/throng');
const fmtLogger = require('./node_modules/logfmt');
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
  const logger = new WorkerLogger(workerId, fmtLogger);

  logger.log({
    type: 'info',
    pid: process.pid,
    msg: 'start',
  });

  const messageQueue = getMessageQueue(kue);
  const contentProvider = createContentProvider(faker, config.auth);

  const requestStatsParams = {
    slowRequestMs: config.slowRequestMs,
    avgInfoIntervalMs: config.avgInfoIntervalMs,
    onSlowRequest: (info) => {
      messageQueue.push('slowRequest', {
        info,
        workerType: 'creator',
      });
    },
    onAvgResponceInfo: (info) => {
      messageQueue.push('statsData', {
        info,
        workerType: 'creator',
      });
    },
  };

  let worker;
  const requestStats = createRequestStats(q, uid, requestStatsParams);

  signUp(q, requestStats, contentProvider, restify, config.apiUrl).then((data) => {
    logger.log({
      type: 'info',
      msg: 'authorized',
    });

    messageQueue.push('authentification', {
      token: data.token,
    });
    const staffApi =
      getStaffApiByToken(q, requestStats, contentProvider, restify, config.apiUrl, data.token);
    worker = new WorkerCreator(messageQueue, staffApi, q, logger);
    worker.beginWork();
  }).catch((err) => {
    logger.log({
      type: 'error',
      error: err,
    });
  });

  process.on('SIGTERM', () => {
    logger.log({
      type: 'info',
      msg: 'termination',
    });
    worker.terminate().then(() => {
      logger.log({
        type: 'info',
        msg: 'terminated',
      });
      process.exit();
    });
  });
}

throng({
  start,
  workers: config.concurrency,
});
