(() => {
  'use strict';

  const config = {
    concurrency: 1,
    apiUrl: 'http://td-rest-api.herokuapp.com:80',
    slowRequestMs: 1000,
    avgInfoIntervalMs: 3000,
    numberOfCompanies: 3,
    usersPerCompany: 2,
    auth: {
      email: 'alexsanyakoval@gmail.com',
      password: 'staff.com',
    },
  };

  module.exports = config;
})();
