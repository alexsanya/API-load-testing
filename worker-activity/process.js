const Q = require('q');
const uid = require('uid');
const Websocket = require('websocket');
const restify = require('restify');
const simpleNodeLogger = require('simple-node-logger');
const faker = require('faker');
const kue = require('kue');
const DigestTimer = require('../lib/digestTimer');
const WorkerLogger = require('../lib/workerLogger');
const messageQueue = require('../lib/messageQueue')(kue, process.env.REDIS_URL);
const createRequestStats = require('../lib/requestStats')(process, Q, uid);
const contentProvider = require('../lib/contentProvider')(faker);
const StaffApi = require('../lib/staffAPI');
const ActiveUser = require('./activeUser');
const activityConfig = require('../config');
const WorkerActivity = require('./workerActivity')
  (Q, Websocket, DigestTimer, messageQueue, StaffApi, ActiveUser, restify, contentProvider, activityConfig);

const args = process.argv.slice(2);

if (args.length < 1) {
  process.stdout.write('Command line arguments are required\n');
  process.stdout.write('node process.js {slowResponseTime}\n');
  process.exit();
}

const config = {
  slowRequestMs: parseInt(args[0], 10),
  avgInfoIntervalMs: 3000,
};

const log = simpleNodeLogger.createSimpleLogger();
log.setLevel('info');

log.info('Worker process launched with config:\n', config);

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

  const requestStats = createRequestStats(requestStatsCfg);
  const worker = new WorkerActivity(requestStats, logger);
  logger.info('started');
  worker.beginWork();

  process.on('SIGTERM', () => {
    logger.info('terminated');
    process.exit();
  });
}

start(1);
