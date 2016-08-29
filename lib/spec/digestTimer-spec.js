(() => {
  'use strict';

  const sinon = require('sinon');

  let DigestTimer = require('../digestTimer.js');

  describe('digest timer', () => {

    it('should execute callback after certain time' , () => {
      let callback = sinon.spy();
      let digestimer = new DigestTimer(5*10, 10*1e3, callback);
      digestimer.setNumber(1);
      for (let i = 0; i < 5; i++) {
        digestimer.tick();
      }
      sinon.assert.callCount(callback, 1);
    });

    it('should execute callback with correct index' , () => {
      let callback = sinon.spy();
      let digestimer = new DigestTimer(5*10, 10*1e3, callback)
      digestimer.setNumber(3);
      for (let i = 0; i < 5; i++) {
        digestimer.tick();
      }
      sinon.assert.calledWith(callback, 0);
      digestimer.tick();
      sinon.assert.calledWith(callback, 1);
      digestimer.tick();
      sinon.assert.calledWith(callback, 2);
    });

  });

})();
