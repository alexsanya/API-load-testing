(() => {
  'use strict';
  
  class WorkersGroupStats {
    constructor(q, logUpdate) {
      this.q = q;
      this.logUpdate = logUpdate;
      this.overallStats = {};
    }

    adjustStats(stats) {
      const workerType = stats.workerType;
      const workerId = stats.workerId;
      if (!Object.prototype.hasOwnProperty.call(this.overallStats, workerType)) {
        this.overallStats[workerType] = new Map();
      }
      this.overallStats[workerType].set(workerId, stats.info);

      return this.q.resolve();
    }

    mergeStats(commonStats, newStats) {
      return {
        requestsTotal: commonStats.requestsTotal + newStats.requestsTotal,
        durationTotalMs: commonStats.durationTotalMs + newStats.durationTotalMs,
        errorsType5x: commonStats.errorsType5x + newStats.errorsType5x,
        errorsType4x: commonStats.errorsType4x + newStats.errorsType4x,
        slowestRequestMs: Math.max(commonStats.slowestRequestMs, newStats.slowestRequestMs),
      };
    }

    getAvgStatsForWorker(workerType) {
      let workersOnline = 0;
      let totalStats = {
        requestsTotal: 0,
        durationTotalMs: 0,
        errorsType4x: 0,
        errorsType5x: 0,
        slowestRequestMs: 0,
      };

      if (!Object.prototype.hasOwnProperty.call(this.overallStats, workerType)) {
        return totalStats;
      }

      for (const workerStats of this.overallStats[workerType].values()) {
        totalStats = this.mergeStats(totalStats, workerStats);
        workersOnline++;
      }
      totalStats.workersOnline = workersOnline;

      return totalStats;
    }

    showStats(countdown) {
      let output = [`Till the end: ${countdown}`];
      Object.keys(this.overallStats).forEach((workerType) => {
        const statsAvg = this.getAvgStatsForWorker(workerType);
        const avgResponseTime = statsAvg.durationTotalMs ?
          statsAvg.durationTotalMs / statsAvg.requestsTotal : 0;
        output = output.concat([
          `Worker: ${workerType}`,
          `Workers online: ${statsAvg.workersOnline}`,
          `Average API response time: ${avgResponseTime}ms`,
          `Amount of 4XX errors: ${statsAvg.errorsType4x}`,
          `Amount of 5XX errors: ${statsAvg.errorsType5x}`,
          `Slowest request time: ${statsAvg.slowestRequestMs}ms`,
        ]);
      });
      this.logUpdate(output.join('\n'));
    }
  }

  module.exports = function getWorkerGroupStats(q, logUpdate) {
    return new WorkersGroupStats(q, logUpdate);
  }

})();
