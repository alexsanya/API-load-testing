import Q from './node_modules/q';
import restify from './node_modules/restify';
import config from './config';
import contentProvider from './contentProvider';

class StaffAPIConnection {
  constructor(client, token) {
    this.client = client;
    this.token = token;
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

    return deferred.promise;
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
    return deferred.promise;
  }
}

export default function signUp() {
  const deferred = Q.defer();
  const headers = {};
  const client = restify.createJsonClient({
    headers,
    url: config.apiURL,
  });

  client.post('/api/1.0/login', contentProvider.getAuthData(), (err, req, res, obj) => {
    if (err) {
      return deferred.reject(err);
    }
    headers.Authorization = `JWT ${obj.data.token}`;
    return deferred.resolve(new StaffAPIConnection(client, obj.data.token));
  });

  return deferred.promise;
}
