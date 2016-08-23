(() => {
  'use strict';

  const ONE_SECOND = 1000;

  class MasterProcess {
    constructor(q, messageQueue, workerGroupStats, config, logger) {
      this.q = q;
      this.logger = logger;
      this.config = config;
      this.messageQueue = messageQueue;
      this.countdown = config.testTime;
      this.workerGroupStats = workerGroupStats;
    }

    updateRuntimeInfo() {
      const statsInfo = this.workerGroupStats.showStats(this.countdown);
      if (this.countdown) {
        setTimeout(this.updateRuntimeInfo.bind(this), ONE_SECOND);
      } else {
        this.config.onFinish(statsInfo);
      }
      this.countdown--;
    }

    sendJobs() {
      const job = {
        numOfUsers: this.config.usersPerCompany,
      };

      for (let i = 0; i < this.config.numberOfCompanies; i++) {
        this.logger.info('Sent job for company creation ', job);
        this.messageQueue.push('createCompany', job);
      }
    }

    listen() {
      this.messageQueue.on('slowRequest', (info) => {
        this.logger.warn('Slow request ', info);
        return this.q.resolve();
      });
      this.messageQueue.on('workerRequestError', (info) => {
        this.logger.warn('Failed request ', info);
        return this.q.resolve();
      });
    }
  }

  module.exports = MasterProcess;
})();
