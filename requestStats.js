import uid from './node_modules/uid';
import Q from './node_modules/q';

class RequestStats {
  constructor(config) {
    this.config = config;
    this.startMoments = {};
    this.stats = {
      requestsTotal: 0,
      durationTotalMs: 0,
      errorsType5x: 0,
      errorsType4x: 0,
      slowestRequestMs: 0,
    };

    this.sendStats();
  }

  sendStats() {
    this.config.onAvgResponceInfo(this.stats);
    setTimeout(this.sendStats.bind(this), this.config.avgInfoIntervalMs);
  }

  startCounter() {
    const currentMomentId = uid();
    this.startMoments[currentMomentId] = process.hrtime();
    return currentMomentId;
  }

  getDuration(requestId) {
    const timeDiff = process.hrtime(this.startMoments[requestId]);
    const durationMs = (timeDiff[0] * 1e3) + Math.round(timeDiff[1] / 1e6);
    // delete startMoments[requestId];
    return durationMs;
  }

  adjustStats(requestId, data) {
    const durationMs = this.getDuration(requestId);
    this.stats.requestsTotal++;
    this.stats.durationTotalMs += durationMs;
    if (durationMs > this.config.slowRequestMs) {
      this.config.onSlowRequest(data);
    }
    this.stats.slowestRequestMs = Math.max(durationMs, this.stats.slowestRequestMs);
  }

  addStatsMiddleware(promise) {
    const requestId = this.startCounter();
    return promise.then((data) => {
      this.adjustStats(requestId, data);
      return data;
    }).catch((err) => {
      this.adjustStats(requestId, err);
      return Q.reject(err);
    });
  }
}

export default function getRequestStats(config) {
  return new RequestStats(config);
}
