(() => {
  'use strict';

  class ActiveUser {
    constructor(socketConnection, staffApi, typeDepartment, nameDepartment) {
      this.staffApi = staffApi;
      this.typeDepartment = typeDepartment;
      this.nameDepartment = nameDepartment;
      this.socketConnection = socketConnection;
    }

    sentPingRequest() {
      this.socketConnection.sendUTF('2');
    }

    sendActivityRequest() {
      this.staffApi.sendUserActivity(this.typeDepartment, this.nameDepartment);
    }
  }

  module.exports = ActiveUser;
})();
