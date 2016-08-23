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

    requestErrorHandler({ err, detailInfo }) {
      this.logger.error('request error', err, detailInfo);
      this.messageQueue.push('workerRequestError', detailInfo);
    }

    inviteUsers(numOfUsers, workspaceId) {
      const usersRequests = [];
      const reportNewUser = (companyId, userData) => {
        const newUserData = {
          id: userData.userId,
          company: companyId,
        };
        this.logger.info({
          action: 'user invited',
          id: userData.userId,
          company: companyId,
        });
        this.messageQueue.push('newUser', newUserData);
        return userData;
      };
      for (let i = 0; i < numOfUsers; i++) {
        usersRequests.push(this.staffApi.inviteUser(workspaceId)
          .then(reportNewUser.bind(this, workspaceId))
        );
      }

      return this.q.all(usersRequests);
    }

    createCompany(data) {
      return this.staffApi.createCompany()
        .then((companyData) => {
          this.logger.info(`created company with id ${companyData.id}`);
          this.companiesCreated.push(companyData.id);
          return companyData.id;
        })
        .then(this.staffApi.createWorkspace.bind(this.staffApi))
        .then((workspaceData) => {
          this.logger.info(`created workspace with id ${workspaceData.id}`);
          return workspaceData.id;
        })
        .then(this.inviteUsers.bind(this, data.numOfUsers))
        .catch(this.requestErrorHandler.bind(this));
    }

    deleteCompany(companyId) {
      return this.staffApi.deleteCompany(companyId).then(() => {
        this.logger.info(`removed company with id: ${companyId}`);
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
