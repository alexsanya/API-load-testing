(() => {
  'use strict';

  class ActiveUser {
    constructor(apiConnection, socketConnection, userId, companyId, performance) {
      this.companyId = companyId;
      this.staffApi = apiConnection;
      this.performance = performance;
      this.socketConnection = socketConnection;
      this.headers = {
        'Authorization': `JWT ${this.staffApi.getToken()}`,
        'X-Company-ID': this.companyId,
      }
      this.socketConnection.emit('subscribe', {
        users: [userId],
        company:  companyId,
        detail: ['worklog', 'timeuse']
      });
      this.socketConnection.emit('api', {
        id: 'putStatus',
        method: 'put',
        path: '/api/1.0/status',
        body: { mode: 'mobile' },
        query: { company: companyId },
        headers: this.headers,
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
        headers: this.headers,
      });
    }
  }

  module.exports = ActiveUser;
})();
