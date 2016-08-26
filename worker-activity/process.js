const Q = require('./node_modules/q');
const uid = require('./node_modules/uid');
const Websocket = require('./node_modules/websocket');
const restify = require('./node_modules/restify');
const throng = require('./node_modules/throng');
const simpleNodeLogger = require('./node_modules/simple-node-logger');
const faker = require('./node_modules/faker');
const kue = require('./node_modules/kue');
const DigestTimer = require('../lib/digestTimer');
const WorkerLogger = require('../lib/workerLogger');
const messageQueue = require('../lib/messageQueue')(kue);
const createRequestStats = require('../lib/requestStats').create;
const contentProvider = require('../lib/contentProvider')(faker);
const WorkerActivity = require('./workerActivity');
const ActiveUser = require('./activeUser');
const activityList = require('./activityList');
const StaffApi = require('../lib/staffAPI');

const args = process.argv.slice(2);

if (args.length < 4) {
  process.stdout.write('Command line arguments are required\n');
  process.stdout.write('babel-node process.js ' +
      '{ApiUrl} {socketConnectionURL} {concurrency} {slowResponseTime} ' +
      '--presets es2015,stage-2\n');
  process.exit();
}

const config = {
  apiUrl: args[0],
  socketConnectionURL: args[1],
  concurrency: parseInt(args[2], 10),
  slowRequestMs: parseInt(args[3], 10),
  avgInfoIntervalMs: 3000,
};

const log = simpleNodeLogger.createSimpleLogger();
log.setLevel('info');

log.info('Worker process launched with congig:\n', config);

function start(workerId) {
  const logger = new WorkerLogger(workerId, log);
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
  const worker = new WorkerActivity(
    Q, Websocket, DigestTimer, messageQueue,
    StaffApi, logger, ActiveUser, config.socketConnectionURL,
    requestStats, restify, config.apiUrl, contentProvider, activityList
  );
  logger.info('started');
  worker.beginWork();

  process.on('SIGTERM', () => {
    logger.info('terminated');
    process.exit();
  });
}

throng({
  start,
  workers: config.concurrency,
});
