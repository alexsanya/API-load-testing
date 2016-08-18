(() => {
  'use strict';

  function responseHandler(deferred, err, req, res, obj) {
    const data = obj ? obj.data : {};
    const detailInfo = {
      request: {
        method: req.method,
        path: req.path,
        headers: req._headers,
      },
      response: {
        code: res.statusCode,
        message: res.statusMessage,
        headers: res.headers,
        body: res.body,
      },
    };

    if (err) {
      return deferred.reject({ err, detailInfo });
    }
    return deferred.resolve({ data, detailInfo });
  }

  class StaffAPIConnection {
    constructor(q, requestStats, contentProvider, token, client) {
      this.q = q;
      this.requestStats = requestStats;
      this.contentProvider = contentProvider;
      this.token = token;
      this.client = client;
    }

    createCompany() {
      const deferred = this.q.defer();

      this.client.post('/api/1.0/companies',
        this.contentProvider.getNewCompanyData(),
        responseHandler.bind(null, deferred)
      );

      return this.requestStats.addStatsMiddleware(deferred.promise);
    }

    deleteCompany(companyId) {
      const deferred = this.q.defer();

      this.client.del(`/api/1.0/companies/${companyId}`, responseHandler.bind(null, deferred));

      return deferred.promise;
    }

    inviteUser(companyData) {
      const deferred = this.q.defer();

      this.client.post(`/api/1.0/invitations?company=${companyData.id}`,
        this.contentProvider.getNewUserData(),
        responseHandler.bind(null, deferred)
      );

      return this.requestStats.addStatsMiddleware(deferred.promise);
    }

    sendUserActivity(typeDepartment, nameDepartment) {
      const deferred = this.q.defer();
      const date = (new Date()).toISOString();

      this.client.put(`/api/1.0/activity/${date}`,
        this.contentProvider.getUserActivityData(nameDepartment, typeDepartment),
        responseHandler.bind(null, deferred)
      );

      return this.requestStats.addStatsMiddleware(deferred.promise);
    }
  }

  function getStaffApiByToken(q, requestStats, contentProvider, restify, apiUrl, token) {
    const client = restify.createJsonClient({
      headers: {
        Authorization: `JWT ${token}`,
      },
      url: apiUrl,
    });
    return new StaffAPIConnection(q, requestStats, contentProvider, token, client);
  }

  function signUp(q, requestStats, contentProvider, restify, apiUrl) {
    const deferred = q.defer();
    const client = restify.createJsonClient({
      url: apiUrl,
    });

    client.post('/api/1.0/login',
      contentProvider.getAuthData(),
      responseHandler.bind(null, deferred));

    return requestStats.addStatsMiddleware(deferred.promise);
  }

  module.exports = { getStaffApiByToken, signUp };
})();
