(() => {
  'use strict';

  class ContentProvider {
    constructor(faker) {
      this.faker = faker;
    }

    getAuthData(auth) {
      return {
        deviceId: this.faker.random.number(),
        email: auth.email,
        password: auth.password,
      };
    }

    getNewWorkspaceData() {
      return {
        name: 'Default workspace',
        description: 'Default workspace',
        timezone: 'Etc/UTC',
      };
    }

    getNewCompanyData() {
      return {
        name: this.faker.company.companyName(),
      };
    }

    getNewUserData() {
      return {
        name: this.faker.name.findName(),
        email: this.faker.internet.email().split('@')[0] + '@staff.dev',
        role: this.faker.hacker.adjective(),
      };
    }

    getRandomInt(min, max) {
      return Math.floor(Math.random() * (max - min)) + min;
    }

    getUserActivityData(config, typeDepartment, nameDepartment) {
      let startTimestamp = this.getRandomInt(0, 100) + 50;
      const data = {
        timeuse: [],
        worklog: {
          end: startTimestamp + this.getRandomInt(0, 100),
          mode: 'computer',
          start: startTimestamp,
        },
        [typeDepartment]: nameDepartment,
      };

      const timeLogNums = this.getRandomInt(2, 10);
      for (let i = 0; i < timeLogNums; i++) {
        startTimestamp = this.getRandomInt(0, 100) + 50;
        const app = config.apps[this.getRandomInt(0, config.apps.length)];
        data.timeuse.push({
          app: app.name,
          end: startTimestamp + this.getRandomInt(0, 100),
          start: startTimestamp,
          title: app.titles[this.getRandomInt(0, app.titles.length)],
          url: '',
        });
      }

      return data;
    }
  }

  function create(faker, auth) {
    return new ContentProvider(faker, auth);
  }

  module.exports = { create };
})();
