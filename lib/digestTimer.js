(() => {
  'use strict';

  class DigestTimer {
    constructor(eventPeriod, quantum, callback) {
      this.number = 0;
      this.eventPeriod = eventPeriod * 1e3;
      this.quantum = quantum;
      this.callback = callback;

      this.activeIndex = 0;
      this.tiksCounter = 0;
    }

    setNumber(n) {
      this.number = n;
      if (n) {
        this.calculateCounters();
      }
    }

    calculateCounters() {
      this.tiksMax = Math.round((this.eventPeriod / this.number) / this.quantum);
    }

    tick() {
      if (!this.number) {
        return;
      }
      this.tiksCounter++;
      if (this.tiksCounter > this.tiksMax) {
        this.tiksCounter = 0;
        this.digest();
      }
    }

    digest() {
      this.callback(this.activeIndex);
      this.activeIndex = (this.activeIndex + 1) % this.number;
    }

  }

  module.exports = DigestTimer;
})();

