(() => {
  'use strict';

  class ActiveUser {
    constructor(apiConnection, socketConnection, userId, companyId, performance) {
      this.companyId = companyId;
      this.staffApi = apiConnection;
      this.performance = performance;
      this.socketConnection = socketConnection;
      this.socketConnection.emit('subscribe', {
        users: [userId],
        company:  companyId,
        detail: ['worklog', 'timeuse']
      });
    }

    sendActivityRequest(config) {
      const date = new Date().toISOString();

      this.socketConnection.emit('api', {
        id: 'putActivity',
        method: 'put',
        path: `/api/1.0/activity/${date}`,
        body: this.staffApi.getUserActivity(config, this.performance),
        query: {company: this.companyId},
        headers: {
          'Authorization': `JWT ${this.staffApi.getToken()}`,
          'X-Company-ID': this.companyId,
        }
      });
    }
  }

  module.exports = ActiveUser;
})();
