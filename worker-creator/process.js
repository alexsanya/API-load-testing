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
const createRequestStats = require('../lib/requestStats').create;
const createContentProvider = require('../lib/contentProvider').create;
const getMessageQueue = require('../lib/messageQueue');
const WorkerLogger = require('../lib/workerLogger');


const args = process.argv.slice(2);

if (args.length < 5) {
  process.stdout.write('Command line arguments are required\n');
  process.stdout.write('babel-node process.js ' +
      '{ApiUrl} {concurrency} {slowResponseTime} {companiesNumber} ' +
      '{usersPerCompany}--presets es2015,stage-2\n');
  process.exit();
}

const config = {
  apiUrl: args[0],
  concurrency: parseInt(args[1], 10),
  slowRequestMs: parseInt(args[2], 10),
  numberOfCompanies: parseInt(args[3], 10),
  usersPerCompany: parseInt(args[4], 10),
  avgInfoIntervalMs: 3000,
};

const log = simpleNodeLogger.createSimpleLogger();
log.setLevel('info');

log.info('Worker process launched with congig:\n', config);

function start(workerId) {
  const logger = new WorkerLogger(workerId, log);

  logger.info(`process started with pid: ${process.pid}`);

  const messageQueue = getMessageQueue(kue);
  const contentProvider = createContentProvider(faker, authInfo);

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
