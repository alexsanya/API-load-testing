const Q = require('q');
const uid = require('uid');
const io = require('socket.io-client');
const restify = require('restify');
const simpleNodeLogger = require('simple-node-logger');
const faker = require('faker');
const kue = require('kue');
const DigestTimer = require('../lib/digestTimer');
const WorkerLogger = require('../lib/workerLogger');
const messageQueue = require('../lib/messageQueue')(kue, process.env.REDIS_HOST);
const createRequestStats = require('../lib/requestStats')(process, Q, uid);
const globalConfig = require('../config');
const contentProvider = require('../lib/contentProvider')(faker, globalConfig);
const StaffApi = require('../lib/staffAPI')(Q, restify);
const ActiveUser = require('./activeUser');
const activityConfig = require('../config');
const WorkerActivity = require('./workerActivity')
  (Q, io, DigestTimer, messageQueue, StaffApi, ActiveUser, restify, contentProvider, activityConfig);

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

  messageQueue.on('shutdown', globalConfig.shutdown.bind(null, log, Q, process));

  process.on('SIGTERM', () => {
    logger.info('terminated');
    process.exit();
  });
}

start(1);
