const q = require('q');
const kue = require('kue');
const faker = require('faker');
const request = require('request');
const restify = require('restify');
const simpleNodeLogger = require('simple-node-logger');
const DigestTimer = require('../lib/digestTimer');
const messageQueue = require('../lib/messageQueue')(kue, process.env.REDIS_HOST);
const log = simpleNodeLogger.createSimpleLogger();
const StaffApi = require('../lib/staffAPI')(q, restify, log);
const globalConfig = require('../config');
const contentProvider = require('../lib/contentProvider')(faker, globalConfig);
const ScreenShotsApi = require('../lib/screenShotsApi')(q, request, restify, StaffApi.responseHandler, log);
const ScreenshotGenerator = require('./screenshotGenerator')(q, log, StaffApi, ScreenShotsApi, contentProvider);

const SCREENSHOT_INTERVAL_S = 15*60;
const INFO_INTERVAL_S = 3;
const QUANTUM_TIME_MS = 100;

log.setLevel('info');

log.info('Screenshots worker launched');

const usersList = [];
const screenShotsEmulation = new DigestTimer(
  SCREENSHOT_INTERVAL_S,
  QUANTUM_TIME_MS,
  (userIndex) => {
    log.debug(`digest timer triggered for index ${userIndex}`);
    usersList[userIndex].sendScreenShot();
  }
);

const workerInfoFrame = new DigestTimer(
  INFO_INTERVAL_S,
  QUANTUM_TIME_MS,
  () => {
    messageQueue.push('statsData', {
      info: {
        requestsTotal: 0,
        durationTotalMs: 0,
        errorsType4x: 0,
        errorsType5x: 0,
        slowestRequestMs: 0,
      },
      workerId: 1,
      workerType: 'screenshots',
    });
  }
);

workerInfoFrame.setNumber(1);

const doDigestLoop = () => {
  screenShotsEmulation.tick();
  workerInfoFrame.tick();
  setTimeout(doDigestLoop, QUANTUM_TIME_MS);
};

doDigestLoop();

messageQueue.on('shutdown', globalConfig.shutdown.bind(null, log, q, process));

messageQueue.on('userLoggedIn', (userData) => {
  usersList.push(new ScreenshotGenerator(userData));
  screenShotsEmulation.setNumber(usersList.length);
  log.debug('New user authorized');
  return q.resolve();
});