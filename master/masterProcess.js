(() => {
  'use strict';

  const ONE_SECOND = 1000;

  class MasterProcess {
    constructor(messageQueue, workerGroupStats, config) {
      this.config = config;
      this.messageQueue = messageQueue;
      this.countdown = config.testTime;
      this.workerGroupStats = workerGroupStats;
    }

    updateRuntimeInfo() {
      this.workerGroupStats.showStats(this.countdown);
      if (this.countdown) {
        setTimeout(this.updateRuntimeInfo.bind(this), ONE_SECOND);
      } else {
        this.config.onFinish();
      }
      this.countdown--;
    }

    sendJobs() {
      for (let i = 0; i < this.config.numberOfCompanies; i++) {
        this.messageQueue.push('createCompany', {
          numOfUsers: this.config.usersPerCompany,
        });
      }
    }

    listen() {
      this.messageQueue.on('statsData',
        this.workerGroupStats.adjustStats.bind(this.workerGroupStats));
    }
  }

  module.exports = MasterProcess;
})();
