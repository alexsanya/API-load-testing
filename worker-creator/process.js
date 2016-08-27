const q = require('./node_modules/q');
const uid = require('./node_modules/uid');
const restify = require('./node_modules/restify');
const throng = require('./node_modules/throng');
const simpleNodeLogger = require('./node_modules/simple-node-logger');
const faker = require('./node_modules/faker');
const kue = require('./node_modules/kue');
const signUp = require('../lib/staffAPI').signUp;
const getStaffApiByToken = require('../lib/staffAPI').getStaffApiByToken;
const authInfo = require('./config');
const WorkerCreator = require('./workerCreator');
const createRequestStats = require('../lib/requestStats')(q, uid);
const contentProvider = require('../lib/contentProvider')(faker);
const messageQueue = require('../lib/messageQueue')(kue);
const WorkerLogger = require('../lib/workerLogger');

const args = process.argv.slice(2);

if (args.length < 3) {
  process.stdout.write('Command line arguments are required\n');
  process.stdout.write('node process.js {ApiUrl} {concurrency} {slowResponseTime}\n');
  process.exit();
}

const config = {
  apiUrl: args[0],
  concurrency: parseInt(args[1], 10),
  slowRequestMs: parseInt(args[2], 10),
  avgInfoIntervalMs: 3000,
};

const log = simpleNodeLogger.createSimpleLogger();
log.setLevel('info');

log.info('Worker process launched with congig:\n', config);

function start(workerId) {
  const logger = new WorkerLogger(workerId, log);

  logger.info(`process started with pid: ${process.pid}`);

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
  const requestStats = createRequestStats(requestStatsParams);

  signUp(q, requestStats, contentProvider, restify, config.apiUrl, authInfo).then((staffApi) => {
    logger.info('authorized');
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
