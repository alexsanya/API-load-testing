(() => {
  'use strict';

  class DigestTimer {
    constructor(eventPeriod, quantum, callback) {
      this.number = 0;
      this.eventPeriod = eventPeriod*10e3;
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
      this.tiksMax = Math.round((this.eventPeriod / this.number ) / this.quantum);
    }

    tick() {
      if (!this.number) {
        return;
      }
      tiksCounter++;
      if (this.tiksCounter > this.tiksMax) {
        tiksCounter = 0;
        this.digest();
      }
    }

    digest() {      
      callback(this.activeIndex);
      this.activeIndex = (this.activeIndex + 1) % this.number;
    }

  }

  module.exports = DigestTimer;
})();

