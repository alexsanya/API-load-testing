(() => {
  'use strict';

  module.exports = (q, contentProvider, restify, authInfo) => {
    class WorkerCreator {
      constructor(requestStats, messageQueue, staffApi, logger, syncInvite) {
        this.requestStats = requestStats;
        this.staffApi = staffApi;
        this.messageQueue = messageQueue;
        this.companiesCreated = [];
        this.logger = logger;
        this.syncInvite = syncInvite;
      }

      requestErrorHandler({ err, detailInfo }) {
        this.logger.error('request error', err, detailInfo);
        this.messageQueue.push('workerRequestError', detailInfo);
      }

      reportNewUser(companyId, data, userData) {
        const newUserData = {
          id: userData.userId,
          name: userData.args.name,
          email: userData.args.email,
          company: companyId,
          apiUrl: data.apiUrl,
          socketUrl: data.socketUrl,
        };
        this.logger.info('user invited', newUserData);
        this.messageQueue.push('newUser', newUserData);
        return userData;
      };

      inviteUsersAsync(data, workspaceId) {
        const usersRequests = [];

        for (let i = 0; i < data.numOfUsers; i++) {
          usersRequests.push(this.apiConnection.inviteUser(workspaceId)
            .then(this.reportNewUser.bind(this, workspaceId, data))
          );
        }

        return q.all(usersRequests);
      }

      inviteUsersSync(numOfUsers, data, workspaceId) {
        if (!numOfUsers) {
          return q.resolve();
        }

        return this.apiConnection.inviteUser(workspaceId)
          .then(this.reportNewUser.bind(this, workspaceId, data))
          .then(() => {
            return this.inviteUsersSync(numOfUsers - 1, data, workspaceId);
          });
      }

      inviteUsers(data, workspaceId) {
        if (this.syncInvite) {
          return this.inviteUsersSync(data.numOfUsers, data, workspaceId);
        } else {
          return this.inviteUsersAsync(data, workspaceId);
        }
      }

      createCompany(data) {
        return this.staffApi.signUp(q, this.requestStats, contentProvider, restify, data.apiUrl, authInfo)
          .then((staffApi) => {
            this.logger.info('authorized');
            return staffApi;
          })
          .catch((err) => {
            this.logger.error('Error during sign up', err);
          })
          .then((staffApi) => {
            this.apiConnection = staffApi;
            return staffApi.createCompany();
          })
          .then((companyData) => {
            this.logger.info(`created company ${companyData.name}`);
            this.companiesCreated.push(companyData.id);
            return companyData.id;
          })
          .then((companyId) => {
            return this.apiConnection.createWorkspace(companyId);
          })
          .then((workspaceData) => {
            this.logger.info(`created workspace with id ${workspaceData.id}`);
            return workspaceData.id;
          })
          .then(this.inviteUsers.bind(this, data))
          .catch(this.requestErrorHandler.bind(this));
      }

      deleteCompany(companyId) {
        return this.apiConnection.deleteCompany(companyId).then(() => {
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

        return q.all(promisesList);
      }

    }

    return WorkerCreator;
  };

})();
