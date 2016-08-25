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
      let startTimestamp = this.getRandomInt(0, 80);
      const data = {
        timeuse: [],
        worklog: {
          end: 179,
          mode: 'computer',
          start: startTimestamp,
        },
        sign: '',
      };

      let start = data.worklog.start + 1;
      while (start < 180) {
        const app = config.apps[this.getRandomInt(0, config.apps.length)];
        let end = start + this.getRandomInt(3, 50);
        if (end > 179) {
          end = 179;
        }
        data.timeuse.push({
          app: app.name,
          start: start,
          end: end,
          title: app.titles[this.getRandomInt(0, app.titles.length - 1)],
          url: '',
        });
        start = end + 1;
      }
console.log(data);
      return data;
    }
  }

  function create(faker, auth) {
    return new ContentProvider(faker, auth);
  }

  module.exports = { create };
})();
