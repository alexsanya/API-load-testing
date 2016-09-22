const q = require('q');
const uid = require('uid');
const restify = require('restify');
const simpleNodeLogger = require('simple-node-logger');
const faker = require('faker');
const kue = require('kue');
const staffApi = require('../lib/staffAPI')(q, restify);
const getStaffApiByToken = require('../lib/staffAPI').getStaffApiByToken;
const authInfo = require('../config').auth;
const createRequestStats = require('../lib/requestStats')(process, q, uid);
const globalConfig = require('../config');
const contentProvider = require('../lib/contentProvider')(faker, config);
const WorkerCreator = require('./workerCreator')(q, contentProvider, restify, authInfo);
const messageQueue = require('../lib/messageQueue')(kue, process.env.REDIS_HOST);
const WorkerLogger = require('../lib/workerLogger');

const args = process.argv.slice(2);

if (args.length < 1) {
  process.stdout.write('Command line arguments are required\n');
  process.stdout.write('node process.js {slowResponseTime}\n');
  process.exit();
}

const config = {
  slowRequestMs: parseInt(args[0], 10),
  syncInvite: args.length > 1,
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

  worker = new WorkerCreator(requestStats, messageQueue, staffApi, logger, config.syncInvite);
  worker.beginWork();

  process.on('SIGTERM', () => {
    logger.info('termination started...');
    worker.terminate().then(() => {
      logger.info('terminated');
      process.exit();
    });
  });
}

start(1);
