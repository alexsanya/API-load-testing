import faker from './node_modules/faker';
import config from './config';

const contentProvider = {
  getAuthData() {
    return {
      deviceId: faker.random.number(),
      email: config.auth.email,
      password: config.auth.password,
    };
  },

  getNewCompanyData() {
    return {
      name: faker.company.companyName(),
    };
  },

  getNewUserData() {
    return {
      name: faker.name.findName(),
      email: faker.internet.email(),
      role: faker.hacker.adjective(),
    };
  },
};

export default contentProvider;
