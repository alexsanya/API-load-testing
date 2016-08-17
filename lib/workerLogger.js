(() => {
  'use strict';

  class WorkerLogger {
    constructor(workerId, logger) {
      this.workerId = workerId;
      this.logger = logger;
    }

    info(...data) {
      const params = [`workerId: ${this.workerId} `].concat(data);
      this.logger.info(...params);
    }

    warn(...data) {
      const params = [`workerId: ${this.workerId} `].concat(data);
      this.logger.warn(...params);
    }

    error(...data) {
      const params = [`workerId: ${this.workerId} `].concat(data);
      this.logger.error(...params);
    }

    debug(...data) {
      const params = [`workerId: ${this.workerId} `].concat(data);
      this.logger.debug(...params);
    }
  }

  module.exports = WorkerLogger;
})();
