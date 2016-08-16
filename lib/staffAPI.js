 (() => {
  'use strict';

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

      this.client.post('/api/1.0/companies',
        this.contentProvider.getNewCompanyData(),
        (err, req, res, obj) => {
          if (err) {
            return deferred.reject(err);
          }
          return deferred.resolve(obj.data);
        }
      );

      return this.requestStats.addStatsMiddleware(deferred.promise);
    }

    deleteCompany(companyId) {
      const deferred = this.q.defer();

      this.client.delete(`/api/1.0/companies/${companyId}`, (err, req, res, obj) => {
        if (err) {
          return deferred.reject(err);
        } 
        return deferred.resolve();
      });

      return this.requestStats.addStatsMiddleware(deferred.promise);
    }

    inviteUser(companyData) {
      const deferred = this.q.defer();

      this.client.post(`/api/1.0/invitations?company=${companyData.id}`,
        this.contentProvider.getNewUserData(),
        (err, req, res, obj) => {
          if (err) {
            return deferred.reject(err);
          }
          return deferred.resolve(obj.data);
        }
      );

      return this.requestStats.addStatsMiddleware(deferred.promise);
    }

    sendUserActivity(data) {
      const deferred = this.q.defer();
      const date = (new Date()).toISOString();

      this.client.post(`/api/1.0/activity/${date}`, data, (err, req, res, obj) => {
        if (err) {
          return deferred.reject(err);
        }
        return deferred.resolve(obj.data);
      });

      return this.requestStats.addStatsMiddleware(deferred.promise);
    }
  }

  function getStaffApiByToken(q, requestStats, contentProvider, restify, apiUrl, token) {
    const client = this.restify.createJsonClient({
      headers: {
        Authorization: `JWT ${token}`,
      },
      url: apiUrl,
    });

    return new StaffAPIConnection(q, requestStats, contentProvider, token, client);
  }

  function signUp(q, requestStats, contentProvider, restify, apiUrl) {
    const deferred = q.defer();
    const headers = {};
    const client = restify.createJsonClient({
      headers,
      url: apiUrl,
    });

    client.post('/api/1.0/login', contentProvider.getAuthData(), (err, req, res, obj) => {
      if (err) {
        return deferred.reject(err);
      }
      headers.Authorization = `JWT ${obj.data.token}`;
      const staffApi = new StaffAPIConnection(q, requestStats, contentProvider, obj.data.token, client);
      return deferred.resolve(staffApi);
    });

    return requestStats.addStatsMiddleware(deferred.promise);
  }

  module.exports = { getStaffApiByToken, signUp };

})();