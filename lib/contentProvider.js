(() => {
  'use strict';

  module.exports = function (faker) {
    class ContentProvider {

      getAuthData(auth) {
        return {
          deviceId: faker.random.number(),
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
          name: faker.company.companyName(),
        };
      }

      getNewUserData() {
        return {
          name: faker.name.findName(),
          email: faker.internet.email().split('@')[0] + '@staff.dev',
          role: faker.hacker.adjective(),
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
        return data;
      }
    }

    return new ContentProvider();
  };
})();
