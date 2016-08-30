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

      getRandomListItem(list) {
        return list[this.getRandomInt(0, list.length - 1)];
      }

      chooseAppTypeByHabits(habbits) {
        const rnd = this.getRandomInt(0, 100);
        let total = 0;
        return Object.keys(habbits).find((habit) => {
          total += 100 * habbits[habit];
          return (rnd < total);
        });
      }

      getUserActivityData(config, pereformance) {
        let startTimestamp = this.getRandomInt(0, 80);
        const data = {
          timeuse: [],
          worklog: [{
            end: 179,
            mode: 'computer',
            start: startTimestamp,
          }],
          sign: '',
        };

        let start = startTimestamp + 1;
        while (start < 180) {
          const appType = this.chooseAppTypeByHabits(config.performanceDefinitions[pereformance]);
          const appsList = config.apps[appType]
          const app = this.getRandomListItem(appsList);

          let end = start + this.getRandomInt(3, 50);
          if (end > 179) {
            end = 179;
          }
          const statsItem = {
            app: app.name,
            start: start,
            end: end,
            title: this.getRandomListItem(app.titles),
          }
          if (app.urls) {
            statsItem.url = this.getRandomListItem(app.urls);
          }
          data.timeuse.push(statsItem);
          start = end + 1;
        }
        return data;
      }
    }

    return new ContentProvider();
  };
})();
