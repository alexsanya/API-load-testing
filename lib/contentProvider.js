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

  getUserActivityData(structureBelongsTo) {
    const data = {
      timeuse: [
        {
          app: 'staff.bin',
          end: 92,
          start: 52,
          title: 'Web Inspector - http://desktop.staff.com/#/',
          url: '',
        },
        {
          app: 'gedit',
          end: 105,
          start: 93,
          title: '*Untitled Document 1 - gedit',
          url: '',
        },
        {
          app: 'staff.bin',
          end: 123,
          start: 106,
          title: 'Web Inspector - http://desktop.staff.com/#/',
          url: '',
        },
      ],
      worklog: [
        {
          end: 179,
          mode: 'computer',
          start: 51,
        },
      ],
    };
    const structureName = Object.keys(structureBelongsTo)[0];
    data[structureName] = structureBelongsTo[structureName];

    return data;
  },
};

export default contentProvider;
