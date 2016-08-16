(() => {
  'use strict';

  const config = {
    concurrency: 1,
    apiUrl: 'http://td-rest-api.herokuapp.com:80',
    socketConnectionURL: 'wss://td-rest-api.herokuapp.com/api/1.0/socket/', 
    slowRequestMs: 1000,
    avgInfoIntervalMs: 3000,
  };

  module.exports = config;
})();
