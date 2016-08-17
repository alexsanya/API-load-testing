(() => {
  'use strict';

  class ContentProvider {
    constructor(faker, auth) {
      this.faker = faker;
      this.auth = auth;
    }

    getAuthData() {
      return {
        deviceId: this.faker.random.number(),
        email: this.auth.email,
        password: this.auth.password,
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
        email: this.faker.internet.email(),
        role: this.faker.hacker.adjective(),
      };
    }

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
    }
  }

  function create(faker, auth) {
    return new ContentProvider(faker, auth);
  }

  module.exports = { create };
})();

