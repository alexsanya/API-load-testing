(() => {
  'use strict';

  class ActiveUser {
    constructor(apiConnection, socketConnection, performance) {
      this.staffApi = apiConnection;
      this.performance = performance;
      this.socketConnection = socketConnection;
    }

    sentPingRequest() {
      this.socketConnection.sendUTF('2');
    }

    sendActivityRequest(config) {
      return this.staffApi.sendUserActivity(config, this.performance);
    }
  }

  module.exports = ActiveUser;
})();
