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

    getRandomInt(min, max) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min)) + min;
    }

    getUserActivityData(typeDepartment, nameDepartment) {

      let startTimestamp = this.getRandomInt(0, 100) + 50;
      const data = {
        timeuse: [],
        worklog: {
          end: startTimestamp + this.getRandomInt(0, 100),
          mode: 'computer',
          start: startTimestamp,
        },
        [typeDepartment]: nameDepartment,
      }

      let timeLogNums = this.getRandomInt(2, 10);
      for (let i = 0; i < timeLogNums; i++) {
        let startTimestamp = this.getRandomInt(0, 100) + 50;
        data.timeuse.push({
          app: this.faker.company.companyName(),
          end: startTimestamp + this.getRandomInt(0, 100),
          start: startTimestamp,
          title: this.faker.company.companyName(),
          url: '',
        })
      }

      return data;
    }
  }

  function create(faker, auth) {
    return new ContentProvider(faker, auth);
  }

  module.exports = { create };
})();

