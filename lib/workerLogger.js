(() => {
  'use strict';

  class WorkerLogger {
    constructor(workerId, logger) {
      this.workerId = workerId;
      this.logger = logger;
    }

    log(data) {
      this.logger.log(Object.assign({
        workerId: this.workerId,
        time: (new Date()).toLocaleTimeString(),
      }, data));
    }
  }

  module.exports = WorkerLogger;
})();
