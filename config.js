const config = {
  workerCreatorConcurrency: 1,
  workerActivityConcurrency: 1,
  apiURL: 'http://td-rest-api.herokuapp.com:80',
  socketConnectionURL: 'wss://td-rest-api.herokuapp.com/api/1.0/socket/',
  slowRequestMs: 1000,
  avgInfoIntervalMs: 3000,
  numberOfCompanies: 2,
  usersPerCompany: 1,
  auth: {
    email: 'kovalas@yandex.ru',
    password: 'Drtbrt420',
  },
};

export default config;
