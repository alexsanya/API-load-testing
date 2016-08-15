const Q = require('./node_modules/q');
const kue = require('./node_modules/kue');
const logUpdate = require('./node_modules/log-update');
const getMessageQueue = require('../lib/messageQueue');
const getWorkerGroupStats = require('../lib/workerGroupStats');
const MasterProcess = require('./masterProcess');

(() => {
  'use strict';

  const args = process.argv.slice(2);

  if (args.length < 4) {
    process.stdout.write('Command line arguments are required\n');
    process.stdout.write('babel-node master.js --presets es2015,stage-2 ' +
      'master.js {isDryRun} {testTime} {numberOfCompanies} {usersPerCompany}\n');
    process.exit();
  }

  const config = {
    isDryRun: args[0],
    testTime: parseInt(args[1], 10),
    numberOfCompanies: parseInt(args[2], 10),
    usersPerCompany: parseInt(args[3], 10),
    onFinish: () => {
      process.exit();
    },
  };

  const messageQueue = getMessageQueue(kue);
  const workerGroupStats = getWorkerGroupStats(Q, logUpdate);
  const masterProcess = new MasterProcess(messageQueue, workerGroupStats, config);

  masterProcess.sendJobs();
  masterProcess.updateRuntimeInfo();
  masterProcess.listen();
})();

