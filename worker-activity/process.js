const Q = require('./node_modules/q');
const uid = require('./node_modules/uid');
const Websocket = require('./node_modules/websocket');
const restify = require('./node_modules/restify');
const throng = require('./node_modules/throng');
const logger = require('./node_modules/logfmt');
const faker = require('./node_modules/faker');
const kue = require('./node_modules/kue');
const config = require('./config');
const DigestTimer = require('../lib/digestTimer');
const getMessageQueue = require('../lib/messageQueue');
const createRequestStats = require('../lib/requestStats').create;
const createContentProvider = require('../lib/contentProvider').create;
const WorkerActivity = require('./workerActivity');
const ActiveUser = require('./activeUser');
const getStaffApiByToken = require('../lib/staffAPI').getStaffApiByToken;

function start(workerId) {
  const messageQueue = getMessageQueue(kue);
  const requestStatsCfg = {
    slowRequestMs: config.slowRequestMs,
    avgInfoIntervalMs: config.avgInfoIntervalMs,
    onSlowRequest: (info) => {
      messageQueue.push('slowRequest', {
        info,
        workerId,
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

  logger.log({
    type: 'info',
    worker: workerId,
    msg: 'waiting for authentification',
  });

  messageQueue.on('authentification', (data) => {
    const staffApi = getStaffApiByToken(Q, requestStats, contentProvider,
      restify, config.apiUrl, data.token);
    const worker = new WorkerActivity(
      Q, Websocket, DigestTimer, messageQueue,
      staffApi, ActiveUser, config.socketConnectionURL
    );
    logger.log({
      type: 'info',
      worker: workerId,
      msg: 'started',
    });
    worker.beginWork();

    return Q.resolve();
  });

  process.on('SIGTERM', () => {
    logger.log({
      type: 'info',
      worker: workerId,
      msg: 'terminated',
    });
    process.exit();
  });
}

throng({
  start,
  workers: config.concurrency,
});
