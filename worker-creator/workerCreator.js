(() => {
  'use strict';

  class WorkerCreator {
    constructor(id, messageQueue, staffApi, q) {
      this.q = q;
      this.id = id;
      this.staffApi = staffApi;
      this.messageQueue = messageQueue;
      this.companiesCreated = [];
    }

    requestErrorHandler(err) {
      this.messageQueue.push('workerCreatorRequestError', err);
    }

    createCompany(data) {
      const reportNewUser = (companyId, userData) => {
        const newUserData = {
          id: userData.userId,
          authToken: this.staffApi.getToken(),
          company: companyId,
        };
        this.messageQueue.push('newUser', newUserData);
      };

      return this.staffApi.createCompany()
            .then((companyData) => {
              this.companiesCreated.push(companyData.id);
              for (let i = 0; i < data.numOfUsers; i++) {
                this.staffApi.inviteUser(companyData)
                  .then(reportNewUser.bind(this, companyData.id))
                  .catch(this.requestErrorHandler.bind(this));
              }
            })
            .catch(this.requestErrorHandler.bind(this));
    }

    deleteCompany(companyId) {
      return this.staffApi.createCompany(companyId);
    }

    beginWork() {
      this.messageQueue.on('createCompany', this.createCompany.bind(this));
    }

    terminate() {
      const promisesList = [];
      this.companiesCreated.forEach((companyId) => {
        promisesList.push(this.deleteCompany(companyId));
      });

      return this.q.all(promisesList);
    }

  }

  module.exports = WorkerCreator;
})();