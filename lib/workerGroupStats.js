(() => {
  'use strict';

  module.exports = function (process, q, logUpdate) {
    const STATS_INFO_LIFETIME = 4 * 1e3;

    function toMilliseconds(timeDiff) {
      return (timeDiff[0] * 1e3) + Math.round(timeDiff[1] / 1e6);
    }

    class WorkersGroupStats {
      constructor() {
        this.overallStats = {};
      }

      adjustStats(stats) {
        const workerType = stats.workerType;
        const workerId = stats.workerId;
        if (!Object.prototype.hasOwnProperty.call(this.overallStats, workerType)) {
          this.overallStats[workerType] = new Map();
        }
        this.overallStats[workerType]
          .set(workerId, Object.assign({ timestamp: process.hrtime() }, stats.info));

        return q.resolve();
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

      getWorkersAmount() {
        return Object.keys(this.overallStats).reduce((result, workerType) =>
          result.concat([{
            worker: workerType,
            number: this.getAvgStatsForWorker(workerType).workersOnline,
          }])
        , []);
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

        for (let workerId of this.overallStats[workerType].keys()) {
          const workerStats = this.overallStats[workerType].get(workerId);
          const timeDiff = toMilliseconds(process.hrtime(workerStats.timestamp));
          totalStats = this.mergeStats(totalStats, workerStats);
          workersOnline++;
        };

        return Object.assign({ workersOnline }, totalStats);
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
        const statsText = output.join('\n');
        logUpdate(statsText);

        return statsText;
      }
    }

    return new WorkersGroupStats();
  };

})();
