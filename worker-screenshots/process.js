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

const SCREENSHOT_INTERVAL_S = 20;
const QUANTUM_TIME_MS = 100;

log.setLevel('info');

log.info('Screenshots worker launched\n');

const usersList = [];
const screenShotsEmulation = new DigestTimer(
  SCREENSHOT_INTERVAL_S,
  QUANTUM_TIME_MS,
  (userIndex) => {
    log.debug(`digest timer triggered for index ${userIndex}`);
    usersList[userIndex].sendScreenShot();
  }
);

const doDigestLoop = () => {
  screenShotsEmulation.tick();
  setTimeout(doDigestLoop, QUANTUM_TIME_MS);
};

doDigestLoop();

messageQueue.on('userLoggedIn', (userData) => {
console.log('New user registered', userData);
  usersList.push(new ScreenshotGenerator(userData));
  screenShotsEmulation.setNumber(usersList.length);
  log.debug('New user authorized');
  return q.resolve();
});