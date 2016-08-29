(() => {
  'use strict';

  const chai = require('chai');
  const sinon = require('sinon');
  const uid = require('uid');
  const Q = require('q');
  const assert = chai.assert;

  const mockProcess = {
    hrtime: (base) => {
      if (!base) return 1;
      return [1, 0];
    },
  };

  const RequestStats = require('../requestStats')(mockProcess, Q, uid);

  describe('request stats', () => {

    let statsConfig;
    let requestStats;

    beforeEach(() => {
      statsConfig = {
        avgInfoIntervalMs: 100,
        slowRequestMs: 3000,
        onAvgResponceInfo: sinon.spy(),
      };

      requestStats = new RequestStats(statsConfig);
    });

    function getRequestPromise(code) {
      const deferred = Q.defer();
      deferred.resolve({
        detailInfo: {
          response: {
            code,
          },
        },
      });

      return deferred.promise;
    }

    it('should measure request time', (done) => {

      requestStats.addStatsMiddleware(getRequestPromise(200));
      setTimeout(() => {
        sinon.assert.calledWithMatch(statsConfig.onAvgResponceInfo, {
          requestsTotal: 1,
          durationTotalMs: 1000,
          errorsType5x: 0,
          errorsType4x: 0,
          slowestRequestMs: 1000,
        });
        done();
      }, 200);
    });

    it('should calculate average time', (done) => {

      requestStats.addStatsMiddleware(getRequestPromise(200));
      requestStats.addStatsMiddleware(getRequestPromise(200));
      requestStats.addStatsMiddleware(getRequestPromise(200));

      setTimeout(() => {
        sinon.assert.calledWithMatch(statsConfig.onAvgResponceInfo, {
          requestsTotal: 3,
          durationTotalMs: 3000,
          errorsType5x: 0,
          errorsType4x: 0,
          slowestRequestMs: 1000,
        });
        done();
      }, 200);
    });

    it('should count error requests', (done) => {

      requestStats.addStatsMiddleware(getRequestPromise(200));
      requestStats.addStatsMiddleware(getRequestPromise(400));
      requestStats.addStatsMiddleware(getRequestPromise(500));

      setTimeout(() => {
        sinon.assert.calledWithMatch(statsConfig.onAvgResponceInfo, {
          requestsTotal: 3,
          durationTotalMs: 3000,
          errorsType5x: 1,
          errorsType4x: 1,
          slowestRequestMs: 1000,
        });
        done();
      }, 200);
    });

  });

})();