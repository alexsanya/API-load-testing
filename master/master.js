const Q = require('./node_modules/q');
const kue = require('./node_modules/kue');
const logUpdate = require('./node_modules/log-update');
const simpleNodeLogger = require('./node_modules/simple-node-logger');
const getMessageQueue = require('../lib/messageQueue');
const getWorkerGroupStats = require('../lib/workerGroupStats');
const MasterProcess = require('./masterProcess');

(() => {
  'use strict';

  const args = process.argv.slice(2);

  if (args.length < 4) {
    process.stdout.write('Command line arguments are required\n');
    process.stdout.write('babel-node master.js master.js ' +
      '{isDryRun} {testTime} {numberOfCompanies} {usersPerCompany} --presets es2015,stage-2\n');
    process.exit();
  }

  const log = simpleNodeLogger.createSimpleFileLogger({
    logFilePath: 'apiLoadTesting.log',
    timestampFormat: 'YYYY-MM-DD HH:mm:ss.SSS',
  });

  const config = {
    isDryRun: args[0],
    testTime: parseInt(args[1], 10),
    numberOfCompanies: parseInt(args[2], 10),
    usersPerCompany: parseInt(args[3], 10),
    onFinish: (statsInfo) => {
      log.info('Testing results:\n ', statsInfo);
      setTimeout(process.exit, 1000);
    },
  };

  log.setLevel('info');
  log.info('API test master process launched with congig:\n', config);

  const messageQueue = getMessageQueue(kue);
  const workerGroupStats = getWorkerGroupStats(Q, logUpdate);
  const masterProcess = new MasterProcess(Q, messageQueue, workerGroupStats, config, log);

  masterProcess.sendJobs();
  masterProcess.updateRuntimeInfo();
  masterProcess.listen();
})();

