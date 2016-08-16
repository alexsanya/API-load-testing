(() => {
  'use strict';

  class ActiveUser {
    constructor(socketConnection, staffApi, typeDepartment, nameDepartment) {
      const client = new websocket.client();
      this.staffApi = staffApi;
      this.typeDepartment = typeDepartment;
      this.nameDepartment = nameDepartment;
      this.socketConnection = socketConnection;
    }

    sentPingRequest() {
      this.socketConnection.sendUTF('2');
    }

    sendActivityRequest() {
      this.staffApi.sendUserActivity(typeDepartment, nameDepartment);
    }
  }

  module.exports = ActiveUser;
})();
