(() => {
  'use strict';

  const Q = require('q');
  const chai = require('chai');
  const assert = chai.assert;
  const WorkerGroupStats = require('../workerGroupStats');
  let workerGroupStats;

  describe('worker group stats', () => {

    const commonStats = {
      requestsTotal: 2,
      durationTotalMs: 1000,
      errorsType5x: 0,
      errorsType4x: 1,
      slowestRequestMs: 700,
    };

    const newStats = {
      requestsTotal: 5,
      durationTotalMs: 1500,
      errorsType5x: 1,
      errorsType4x: 0,
      slowestRequestMs: 900,
    };

    let mockProcess;

    beforeEach(() => {
      mockProcess = {
        hrtime: (base) => {
          return [1, 0];
        },
      };
      workerGroupStats = WorkerGroupStats(mockProcess, Q, () => {});
    });

    it('should merge stats correctly', () => {
      const result = workerGroupStats.mergeStats(commonStats, newStats);

      assert.deepEqual(result, {
        requestsTotal: 7,
        durationTotalMs: 2500,
        errorsType5x: 1,
        errorsType4x: 1,
        slowestRequestMs: 900,
      });

    });

    it('should count average stats for worker', () => {
      workerGroupStats.overallStats = {
        workerCreator: new Map([
          ['worker1', commonStats],
          ['worker2', newStats],
        ]),
        workerActivity: new Map([
          ['worker1', newStats],
          ['worker2', newStats],
        ]),
      };

      assert.deepEqual(workerGroupStats.getAvgStatsForWorker('workerCreator'), {
        requestsTotal: 7,
        durationTotalMs: 2500,
        errorsType5x: 1,
        errorsType4x: 1,
        slowestRequestMs: 900,
        workersOnline: 2,
      });
      assert.deepEqual(workerGroupStats.getAvgStatsForWorker('workerActivity'), {
        requestsTotal: 10,
        durationTotalMs: 3000,
        errorsType5x: 2,
        errorsType4x: 0,
        slowestRequestMs: 900,
        workersOnline: 2,
      });
    });

    it('should decline stats it TTL expired', () => {
      mockProcess.hrtime = () => {
        return [5, 0];
      };

      workerGroupStats.overallStats = {
        workerCreator: new Map([
          ['worker1', commonStats],
          ['worker2', newStats],
        ]),
      };

      assert.deepEqual(workerGroupStats.getAvgStatsForWorker('workerCreator'), {
        requestsTotal: 0,
        durationTotalMs: 0,
        errorsType5x: 0,
        errorsType4x: 0,
        slowestRequestMs: 0,
        workersOnline: 0,
      });
    });

    it('should adjust stats correctly', () => {
      workerGroupStats.overallStats = {
        workerCreator: new Map([
          ['worker1', commonStats],
          ['worker2', newStats],
        ]),
      };

      workerGroupStats.adjustStats({
        workerType: 'workerCreator',
        workerId: 'worker3',
        info: commonStats,
      });

      assert(workerGroupStats.overallStats.workerCreator.has('worker3'));
      assert.deepEqual(workerGroupStats.overallStats.workerCreator.get('worker3'), 
        Object.assign({ timestamp: [1, 0] }, commonStats));
    });

    it('should count workers correctly', () => {
      workerGroupStats.overallStats = {
        workerCreator: new Map([
          ['worker1', commonStats],
          ['worker2', newStats],
        ]),
        workerActivity: new Map([
          ['worker1', newStats],
        ]),
      };

      assert.deepEqual(workerGroupStats.getWorkersAmount(), [{
        worker: 'workerCreator',
        number: 2,
      },
      {
        worker: 'workerActivity',
        number: 1,     
      }]);
    });

  });

})();
