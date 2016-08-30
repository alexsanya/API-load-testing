const Q = require('q');
const kue = require('kue');
const faker = require('faker');
const restify = require('restify');
const logUpdate = require('log-update');
const simpleNodeLogger = require('simple-node-logger');
const staffApi = require('../lib/staffAPI');
const messageQueue = require('../lib/messageQueue')(kue);
const workerGroupStats = require('../lib/workerGroupStats')(process, Q, logUpdate);
const contentProvider = require('../lib/contentProvider')(faker);
const DryRunProcess = require('./dryRunProcess');
const MasterProcess = require('./masterProcess');
const authInfo = require('../config').auth;

(() => {
  'use strict';

  const args = process.argv.slice(2);

  if (args.length < 5) {
    process.stdout.write('Command line arguments are required\n');
    process.stdout.write('babel-node master.js master.js {isDryRun} {apiUrl} ' +
      '{testTime} {numberOfCompanies} {usersPerCompany}\n');
    process.exit();
  }

  const log = simpleNodeLogger.createSimpleFileLogger({
    logFilePath: 'apiLoadTesting.log',
    timestampFormat: 'YYYY-MM-DD HH:mm:ss.SSS',
  });

  const config = {
    isDryRun: (args[0] === 'true'),
    apiUrl: args[1],
    testTime: parseInt(args[2], 10),
    numberOfCompanies: parseInt(args[3], 10),
    usersPerCompany: parseInt(args[4], 10),
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

