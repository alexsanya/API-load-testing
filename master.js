import getMessageQueue from './messageQueue';
import getWorkerGroupStats from './workerGroupStats';
import config from './config';

let countdown = 30;
const messageQueue = getMessageQueue();
const workerGroupStats = getWorkerGroupStats();

function updateRuntimeInfo() {
  workerGroupStats.showStats(countdown);
  if (countdown) {
    setTimeout(updateRuntimeInfo, 1000);
  } else {
    process.exit();
  }
  countdown--;
}

function sendJobs() {
  for (let i = 0; i < config.numberOfCompanies; i++) {
    messageQueue.push('createCompany', {
      numOfUsers: config.usersPerCompany,
    });
  }
}

function listen() {
  messageQueue.on('statsData', workerGroupStats.adjustStats.bind(workerGroupStats));
}

sendJobs();
updateRuntimeInfo();
listen();
