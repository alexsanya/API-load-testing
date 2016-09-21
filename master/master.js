const Q = require('q');
const kue = require('kue');
const faker = require('faker');
const restify = require('restify');
const logUpdate = require('log-update');
const simpleNodeLogger = require('simple-node-logger');
const staffApi = require('../lib/staffAPI')(Q, restify);
const messageQueue = require('../lib/messageQueue')(kue, process.env.REDIS_HOST);
const workerGroupStats = require('../lib/workerGroupStats')(process, Q, logUpdate);
const contentProvider = require('../lib/contentProvider')(faker);
const DryRunProcess = require('./dryRunProcess');
const MasterProcess = require('./masterProcess');
const authInfo = require('../config').auth;

(() => {
  'use strict';

  const args = process.argv.slice(2);

  const log = simpleNodeLogger.createSimpleFileLogger({
    logFilePath: 'apiLoadTesting.log',
    timestampFormat: 'YYYY-MM-DD HH:mm:ss.SSS',
  });

  const config = {
    isDryRun: (args.length && args[0] === 'dry'),
    apiUrl: process.env.API_URL || 'http://td-rest-api.herokuapp.com:80',
    socketHost: process.env.SOCKET_HOST || 'wss://td-rest-api.herokuapp.com',
    socketPath: process.env.SOCKET_PATH || '/api/1.0/socket',
    testTime: parseInt(process.env.TIME, 10) || 1800,
    numberOfCompanies: parseInt(process.env.NUMBER_COMPANIES, 10) || 1,
    usersPerCompany: parseInt(process.env.NUMBER_USERS, 10) || 100,
    onFinish: (statsInfo) => {
      messageQueue.shutdown((err) => {
        log.info('Testing results:\n ', statsInfo);
        process.stdout.write('Test finished', err || '');
        process.exit(0);
      });
    },
  };

  log.setLevel('info');
  log.info('API test master process launched with congig:\n', config);

  messageQueue.on('statsData', workerGroupStats.adjustStats.bind(workerGroupStats));

  if (config.isDryRun) {
    const dryRunLog = simpleNodeLogger.createSimpleLogger();
    dryRunLog.setLevel('info');
    const dryRunProcess =
      new DryRunProcess(Q, dryRunLog, staffApi, contentProvider, restify, config.apiUrl);
    dryRunProcess.logIn(authInfo)
      .catch((err) => {
        dryRunLog.info('Unable to log in:\n', err);
        setTimeout(process.exit, 500);
      })
      .then((staffApi) => {
        staffApi.requestStats = {
          addStatsMiddleware: (promise) => promise,
        }

        return staffApi;
      })
      .then(dryRunProcess.checkApi.bind(dryRunProcess))
      .then(() => {
        const workersList = workerGroupStats.getWorkersAmount();
        if (!workersList.length) {
          dryRunLog.info('No workers online');
          return;
        }
        dryRunLog.info('Amount of workers:');
        workersList.forEach(({ worker, number }) => {
          dryRunLog.info(`${worker}: ${number}`);
        });
      })
      .then(() => {
        setTimeout(process.exit, 500);
      });
  } else {
    const masterProcess = new MasterProcess(Q, messageQueue, workerGroupStats, config, log);

    masterProcess.sendJobs();
    masterProcess.updateRuntimeInfo();
    masterProcess.listen();
  }
})();

