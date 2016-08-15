const config = {
  testDuration: 150,
  workerCreatorConcurrency: 2,
  workerActivityConcurrency: 2,
  apiURL: 'http://td-rest-api.herokuapp.com:80',
  socketConnectionURL: 'wss://td-rest-api.herokuapp.com/api/1.0/socket/',
  slowRequestMs: 1000,
  avgInfoIntervalMs: 3000,
  numberOfCompanies: 3,
  usersPerCompany: 2,
  auth: {
    email: 'kovalas@yandex.ru',
    password: 'Drtbrt420',
  },
};

export default config;
