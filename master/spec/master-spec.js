(() => {
  'use strict';

  const chai = require('chai');
  const sinon = require('sinon');
  const expect = chai.expect;
  const assert = chai.assert;

  const Q = require('q');

  let MasterProcess = require('../masterProcess');

  describe('master process', () => {
    let mockMQ = {};
    let mockWGStats = {};
    let mockLogger = {
      info: () => {}
    };
    let config = {
      testTime: 10,
      onFinish: sinon.spy(),
    };

    beforeEach(() => {
      mockMQ = {
        push: sinon.spy(),
        on: sinon.spy(),
      };
      mockWGStats = {
        showStats: sinon.spy(),
        adjustStats: sinon.spy(),
      };
    });

    it('should showStats on runtimeinfo update if test still running', () => {
      let master = new MasterProcess(Q, mockMQ, mockWGStats, config, mockLogger);
      master.updateRuntimeInfo();
      assert(mockWGStats.showStats.calledOnce);
    });

    it('should call finish function when test time expired', () => {
      config.testTime = 0;
      let master = new MasterProcess(Q, mockMQ, mockWGStats, config, mockLogger);
      master.updateRuntimeInfo();
      assert(config.onFinish.calledOnce);
    });

    it('should send tasks to workers', () => {
      config.numberOfCompanies = 5;
      config.usersPerCompany = 3;
      let master = new MasterProcess(Q, mockMQ, mockWGStats, config, mockLogger);
      master.sendJobs();
      sinon.assert.callCount(mockMQ.push, 5);
      assert(mockMQ.push.alwaysCalledWithMatch('createCompany', {
        numOfUsers: 3
      }));
    });

    it('should adjust stats when new data arrives', () => {
      let master = new MasterProcess(Q, mockMQ, mockWGStats, config, mockLogger);
      master.listen();
      assert(mockMQ.on.calledWith('statsData'));
    });

  });

})();