(() => {
  'use strict';

  const config = {
    concurrency: 1,
    apiURL: 'http://td-rest-api.herokuapp.com:80',
    slowRequestMs: 1000,
    avgInfoIntervalMs: 3000,
    numberOfCompanies: 3,
    usersPerCompany: 2,
    auth: {
      email: 'kovalas@yandex.ru',
      password: 'Drtbrt420',
    },
  };

  module.exports = config;
})();
