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

      this.client.del(`/api/1.0/companies/${companyId}`, (err) => {
        if (err) {
          // server always replies with code 403 on this action, but action still takes place
          return deferred.resolve();
        }
        return deferred.resolve();
      });

      return deferred.promise;
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

    sendUserActivity(typeDepartment, nameDepartment) {
      const deferred = this.q.defer();
      const date = (new Date()).toISOString();

      this.client.put(`/api/1.0/activity/${date}`,
        this.contentProvider.getUserActivityData(nameDepartment, typeDepartment),
        (err, req, res, obj) => {
          if (err) {
            return deferred.reject(err);
          }
          return deferred.resolve(obj.data);
        });

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

    client.post('/api/1.0/login', contentProvider.getAuthData(), (err, req, res, obj) => {
      if (err) {
        return deferred.reject(err);
      }
      return deferred.resolve(obj.data);
    });

    return requestStats.addStatsMiddleware(deferred.promise);
  }

  module.exports = { getStaffApiByToken, signUp };
})();
