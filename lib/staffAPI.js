import Q from './node_modules/q';
import restify from './node_modules/restify';
import config from './config';
import contentProvider from './contentProvider';
import getRequestStats from './requestStats';

class StaffAPIConnection {
  constructor(token, client, requestStats) {
    this.token = token;
    this.client = client;
    this.requestStats = requestStats;
  }

  getToken() {
    return this.token;
  }

  createCompany() {
    const deferred = Q.defer();

    this.client.post('/api/1.0/companies',
      contentProvider.getNewCompanyData(),
      (err, req, res, obj) => {
        if (err) {
          return deferred.reject(err);
        }
        return deferred.resolve(obj.data);
      }
    );

    return this.requestStats.addStatsMiddleware(deferred.promise);
  }

  inviteUser(companyData) {
    const deferred = Q.defer();

    this.client.post(`/api/1.0/invitations?company=${companyData.id}`,
      contentProvider.getNewUserData(),
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
    const deferred = Q.defer();
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

function getStaffApiByToken(token, statsConfig) {
  const requestStats = getRequestStats(statsConfig);
  const client = restify.createJsonClient({
    headers: {
      Authorization: `JWT ${token}`,
    },
    url: config.apiURL,
  });

  return new StaffAPIConnection(token, client, requestStats);
}

function signUp(statsConfig) {
  const deferred = Q.defer();
  const headers = {};
  const requestStats = getRequestStats(statsConfig);
  const client = restify.createJsonClient({
    headers,
    url: config.apiURL,
  });

  client.post('/api/1.0/login', contentProvider.getAuthData(), (err, req, res, obj) => {
    if (err) {
      return deferred.reject(err);
    }
    headers.Authorization = `JWT ${obj.data.token}`;
    const staffApi = new StaffAPIConnection(obj.data.token, client, requestStats);
    return deferred.resolve(staffApi);
  });

  return requestStats.addStatsMiddleware(deferred.promise);
}

export { getStaffApiByToken, signUp };

