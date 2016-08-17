const Q = require('./node_modules/q');
const uid = require('./node_modules/uid');
const Websocket = require('./node_modules/websocket');
const restify = require('./node_modules/restify');
const throng = require('./node_modules/throng');
const simpleNodeLogger = require('./node_modules/simple-node-logger');
const faker = require('./node_modules/faker');
const kue = require('./node_modules/kue');
const config = require('./config');
const DigestTimer = require('../lib/digestTimer');
const WorkerLogger = require('../lib/workerLogger');
const getMessageQueue = require('../lib/messageQueue');
const createRequestStats = require('../lib/requestStats').create;
const createContentProvider = require('../lib/contentProvider').create;
const WorkerActivity = require('./workerActivity');
const ActiveUser = require('./activeUser');
const getStaffApiByToken = require('../lib/staffAPI').getStaffApiByToken;

function start(workerId) {
  const log = simpleNodeLogger.createSimpleLogger();
  log.setLevel('info');
  const logger = new WorkerLogger(workerId, log);
  const messageQueue = getMessageQueue(kue);
  const requestStatsCfg = {
    slowRequestMs: config.slowRequestMs,
    avgInfoIntervalMs: config.avgInfoIntervalMs,
    onSlowRequest: (info, time) => {
      logger.warn(`slow request captured time: ${time}ms`, info);
      messageQueue.push('slowRequest', {
        info,
        workerId,
        time,
        workerType: 'activity',
      });
    },
    onAvgResponceInfo: (info) => {
      messageQueue.push('statsData', {
        info,
        workerId,
        workerType: 'activity',
      });
    },
  };

  const requestStats = createRequestStats(Q, uid, requestStatsCfg);
  const contentProvider = createContentProvider(faker, config.auth);

  logger.info('waiting for authentification');

  messageQueue.on('authentification', (data) => {
    const staffApi = getStaffApiByToken(Q, requestStats, contentProvider,
      restify, config.apiUrl, data.token);
    const worker = new WorkerActivity(
      Q, Websocket, DigestTimer, messageQueue,
      staffApi, logger, ActiveUser, config.socketConnectionURL
    );
    logger.info('started');
    worker.beginWork();

    return Q.resolve();
  });

  process.on('SIGTERM', () => {
    logger.info('terminated');
    process.exit();
  });
}

throng({
  start,
  workers: config.concurrency,
});
