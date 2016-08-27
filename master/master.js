const Q = require('./node_modules/q');
const kue = require('./node_modules/kue');
const faker = require('./node_modules/faker');
const restify = require('./node_modules/restify');
const logUpdate = require('./node_modules/log-update');
const simpleNodeLogger = require('./node_modules/simple-node-logger');
const staffApi = require('../lib/staffAPI');
const messageQueue = require('../lib/messageQueue')(kue);
const workerGroupStats = require('../lib/workerGroupStats')(Q, logUpdate);
const contentProvider = require('../lib/contentProvider')(faker);
const DryRunProcess = require('./dryRunProcess');
const MasterProcess = require('./masterProcess');
const authInfo = require('./config');

(() => {
  'use strict';

  const args = process.argv.slice(2);

  if (args.length < 5) {
    process.stdout.write('Command line arguments are required\n');
    process.stdout.write('babel-node master.js master.js {isDryRun} {apiUrl} ' +
      '{testTime} {numberOfCompanies} {usersPerCompany} --presets es2015,stage-2\n');
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
      log.info('Testing results:\n ', statsInfo);
      setTimeout(process.exit, 1000);
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
    dryRunProcess.listenWorkers();
    dryRunProcess.logIn()
      .catch((err) => {
        dryRunLog.info('Unable to log in:\n', err);
        setTimeout(process.exit, 1000);
      })
      .then(dryRunProcess.checkApi.bind(dryRunProcess))
      .then(() => {
        dryRunLog.info('Amount of workers:');
        workerGroupStats.getWorkersAmount().forEach(({ worker, number }) => {
          dryRunLog.info(`${worker}: ${number}`);
        });
      })
      .then(() => {
        setTimeout(process.exit, 3000);
      });
  } else {
    const masterProcess = new MasterProcess(Q, messageQueue, workerGroupStats, config, log);

    masterProcess.sendJobs();
    masterProcess.updateRuntimeInfo();
    masterProcess.listen();
  }
})();

