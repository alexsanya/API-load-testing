(() => {
  'use strict';

  class WorkerCreator {
    constructor(id, messageQueue, staffApi) {
      this.id = id;
      this.staffApi = staffApi;
      this.messageQueue = messageQueue;
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
              for (let i = 0; i < data.numOfUsers; i++) {
                this.staffApi.inviteUser(companyData)
                  .then(reportNewUser.bind(this, companyData.id))
                  .catch(this.requestErrorHandler.bind(this));
              }
            })
            .catch(this.requestErrorHandler.bind(this));
    }

    beginWork() {
      this.messageQueue.on('createCompany', this.createCompany.bind(this));
    }

  }

  module.exports = WorkerCreator;
})();
