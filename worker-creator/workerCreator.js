(() => {
  'use strict';

  class WorkerCreator {
    constructor(messageQueue, staffApi, q, logger) {
      this.q = q;
      this.staffApi = staffApi;
      this.messageQueue = messageQueue;
      this.companiesCreated = [];
      this.logger = logger;
    }

    requestErrorHandler(err) {
      this.logger.log({
        action: 'requesr error',
        data: err,
      });
      this.messageQueue.push('workerCreatorRequestError', err);
    }

    createCompany(data) {
      const reportNewUser = (companyId, userData) => {
        const newUserData = {
          id: userData.userId,
          company: companyId,
        };
        this.logger.log({
          action: 'user invited',
          id: userData.userId,
          company: companyId,
        });
        this.messageQueue.push('newUser', newUserData);
      };

      return this.staffApi.createCompany()
            .then((companyData) => {
              this.logger.log({
                action: 'company created',
                data: companyData.id,
              });
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
      return this.staffApi.deleteCompany(companyId).then(() => {
        this.logger.log({
          companyId,
          action: 'company removed',
        });
      });
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
