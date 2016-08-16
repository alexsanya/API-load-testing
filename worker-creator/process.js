const q = require('./node_modules/q');
const uid = require('./node_modules/uid');
const restify = require('./node_modules/restify');
const throng = require('./node_modules/throng');
const logger = require('./node_modules/logfmt');
const faker = require('./node_modules/faker');
const kue = require('./node_modules/kue');
const signUp = require('../lib/staffAPI').signUp;
const WorkerCreator = require('./workerCreator');
const createRequestStats = require('../lib/requestStats').create;
const createContentProvider = require('../lib/contentProvider').create;
const getMessageQueue = require('../lib/messageQueue');
const config = require('./config');

function start(id) {
  logger.log({
    type: 'info',
    msg: `worker ${id} started`,
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
        workerId: id,
      });
    },
    onAvgResponceInfo: (info) => {
      messageQueue.push('statsData', {
        info,
        workerType: 'creator',
        workerId: id,
      });
    },
  };

  const requestStats = createRequestStats(q, uid, requestStatsParams);

  signUp(q, requestStats, contentProvider, restify, config.apiUrl).then((staffApi) => {
    const worker = new WorkerCreator(id, messageQueue, staffApi, contentProvider);
    worker.beginWork();
  });

  process.on('SIGTERM', process.exit);
}

throng({
  start,
  workers: config.concurrency,
});
