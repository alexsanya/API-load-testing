(() => {
  'use strict';

  const chai = require('chai');
  const assert = chai.assert;
  const faker = require('faker');

  const config = require('../../config');
  const contentProvider = require('../contentProvider')(faker);

  describe('content provider', () => {

    it('should generate user activity', () => {
      console.log(contentProvider.getUserActivityData(config, 'effective'));
      assert(true);
    });
  });
})();