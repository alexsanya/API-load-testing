const curlRequestNative = require('curlrequest');

module.exports = (q, restify, curlRequest) => {
  const TEST_USER_PASSWORD = 'loadtest';

  curlRequest = curlRequest || curlRequestNative;

  function responseHandler(deferred, err, req, res, obj) {
    const data = obj ? obj.data : {};
    const detailInfo = {};
    if (req) {
      detailInfo.request = {
        method: req.method,
        path: req.path,
        headers: req._headers,
      }
    }
    if (res) {
      detailInfo.response = {
        code: res.statusCode,
        message: res.statusMessage,
        headers: res.headers,
        body: res.body,
      }
    }

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

    getUserActivity(config, performance) {
      return this.contentProvider.getUserActivityData(config, performance);
    }

    authorization(companyId) {
      const deferred = this.q.defer();
      this.client.get(`/api/1.0/authorization?company=${companyId}`, responseHandler.bind(null, deferred));

      return this.requestStats.addStatsMiddleware(deferred.promise);
    }
  }

  function signUp(q, requestStats, contentProvider, restify, apiUrl, authData, customHeaders = {}) {
    const deferred = q.defer();
    const clientConfig = {
      url: apiUrl,
      headers: customHeaders,
    };
    const client = restify.createJsonClient(clientConfig);

    client.post('/api/1.0/login', contentProvider.getAuthData(authData),
      responseHandler.bind(null, deferred));

    return requestStats.addStatsMiddleware(deferred.promise).then((data) => {
      clientConfig.headers.Authorization = `JWT ${data.token}`;
      return new StaffAPIConnection(q, requestStats, contentProvider, data.token, client);
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

  function getSignedUrl(apiUrl, companyId, token) {
    const deferred = q.defer();
    const clientConfig = {
      url: apiUrl,
      headers: {
        Authorization: `JWT ${token}`,
        'X-Company-ID': companyId,
      }
    };
    const date = new Date().toISOString();
    const client = restify.createJsonClient(clientConfig);
    client.get(`/api/1.0/files/screenshot/signed-url/${date}/0`, responseHandler.bind(null, deferred));

    return deferred.promise.then((reqInfo) => {
      return JSON.parse(reqInfo.detailInfo.response.body).data;
    });
  }

  function uploadScreenShot(signedUrl, payload) {
    const headers = signedUrl
        .match(/[^&?]*?=[^&?]*/gi)
        .map((p) => p.split('='))
        .reduce((res, param) => {
          const nf = {};
          nf[param[0]] = param[1].replace(/%2F/g, '/').replace(/%3D/g, '=');
          return Object.assign(res, nf)
        }, {});
    curlRequest.request({
      url: signedUrl,
      method: 'PUT',
      data: payload,
      headers,
    }, (err, stdout, meta) => {
      console.log('Errors: ', err);
    })
  }


  return { signUp, register, getSignedUrl, uploadScreenShot };
}

