(() => {
  'use strict';

  class DryRunProcess {
    constructor(q, log, staffApi, contentProvider, restify, apiUrl) {
      this.q = q;
      this.log = log;
      this.staffApi = staffApi;
      this.contentProvider = contentProvider;
      this.restify = restify;
      this.apiUrl = apiUrl;
    }

    logIn(authInfo) {
      const requestStats = {
        addStatsMiddleware: (promise) => {
          return promise.then((res) => {
            return res.data;
          })
          .catch((res) => {
            return this.q.reject(res);
          });
        },
      };

      return this.staffApi
        .signUp(this.q, requestStats, this.contentProvider, this.restify, this.apiUrl, authInfo);
    }

    checkApi(staffApi) {
      let companyId;

      const config = {
        apps: [
          {
            name: 'gedit',
            titles: ['document1', 'readme.txt', 'some file'],
          },
          {
            name: 'staff.com',
            titles: ['title', 'web inspector', 'workspaces'],
          },
          {
            name: 'sublime',
            titles: ['index.js', 'app.js', 'readme.txt'],
          },
        ],
      };

      const showResponseCode = ({ data, detailInfo }) => {
        this.log.info('Code: ', detailInfo.response.code);
        return data;
      };

      this.log.info('Create company request');
      return staffApi.createCompany()
        .then(showResponseCode)
        .then((companyData) => {
          this.log.info('Create workspace');
          return staffApi.createWorkspace(companyData.id);
        })
        .then(showResponseCode)
        .then((workspaceData) => {
          this.log.info('Invite user');
          return staffApi.inviteUser(workspaceData.id);
        })
        .then(showResponseCode)
        .then(() => {
          this.log.info('Send user activity');
          return staffApi.sendUserActivity(config, 'company', companyId);
        })
        .then(showResponseCode)
        .then(() => {
          this.log.info('Delete company');
          return staffApi.deleteCompany(companyId);
        })
        .then(showResponseCode)
        .catch(({ detailInfo }) => {
          this.log.info('Code: ', detailInfo.response.code);
          this.log.info(detailInfo);
        });
    }
  }

  module.exports = DryRunProcess;
})();

