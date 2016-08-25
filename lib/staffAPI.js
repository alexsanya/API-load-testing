(() => {
  'use strict';

  const TEST_USER_PASSWORD = 'loadtest';

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

    getToken() {
      return this.token;
    }

    createCompany() {
      const deferred = this.q.defer();

      this.client.post('/api/1.0/companies', this.contentProvider.getNewCompanyData(),
        responseHandler.bind(null, deferred));

      return this.requestStats.addStatsMiddleware(deferred.promise);
    }

    deleteCompany(companyId) {
      const deferred = this.q.defer();

      this.client.del(`/api/1.0/companies/${companyId}`, responseHandler.bind(null, deferred));

      return deferred.promise;
    }

    createWorkspace(companyId) {
      const deferred = this.q.defer();

      this.client.post(`/api/1.0/workspaces?company=${companyId}`,
        this.contentProvider.getNewWorkspaceData(), responseHandler.bind(null, deferred));

      return this.requestStats.addStatsMiddleware(deferred.promise);
    }

    inviteUser(workspaceId) {
      const deferred = this.q.defer();

      this.client.post(`/api/1.0/invitations?company=${workspaceId}`,
        this.contentProvider.getNewUserData(), responseHandler.bind(null, deferred));

      return this.requestStats.addStatsMiddleware(deferred.promise);
    }

    sendUserActivity(config, typeDepartment, nameDepartment) {
      const deferred = this.q.defer();
      const date = new Date().toISOString();

      this.client.put(`/api/1.0/activity/${date}`,
        this.contentProvider.getUserActivityData(config, nameDepartment, typeDepartment),
        responseHandler.bind(null, deferred));

      return this.requestStats.addStatsMiddleware(deferred.promise);
    }
  }

  function signUp(q, requestStats, contentProvider, restify, apiUrl, authData) {
    const deferred = q.defer();
    const clientConfig = {
      url: apiUrl,
      headers: {}
    };
    const client = restify.createJsonClient(clientConfig);

    client.post('/api/1.0/login', contentProvider.getAuthData(authData),
      responseHandler.bind(null, deferred));

    return requestStats.addStatsMiddleware(deferred.promise).then((data) => {
      clientConfig.headers.Authorization = `JWT ${data.token}`;
      console.log('BEFORE NEW');
      const result = new StaffAPIConnection(q, requestStats, contentProvider, data.token, client);
      return result;
    });
  }

  function register(q, restify, requestStats, apiUrl, userData) {
    const deferred = q.defer();

    const client = restify.createJsonClient({
      url: apiUrl,
    });

    const newUser = {
      name: userData.name,
      email: userData.email,
      password: TEST_USER_PASSWORD,
    };
    client.post('/api/1.0/register', newUser, responseHandler.bind(null, deferred));

    return requestStats.addStatsMiddleware(deferred.promise).then(() => {
      return newUser;
    });
  }

  module.exports = { signUp, register };
})();
