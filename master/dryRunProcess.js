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

    logIn() {
      const requestStats = {
        addStatsMiddleware: (promise) => promise,
      };

      return this.staffApi
        .signUp(this.q, requestStats, this.contentProvider, this.restify, this.apiUrl)
        .then((res) => this.staffApi
              .getStaffApiByToken(this.q, requestStats, this.contentProvider,
                this.restify, this.apiUrl, res.data.token)
        );
    }

    checkApi(staffApi) {
      let companyId;

      const showResponseCode = ({ data, detailInfo }) => {
        this.log.info('Code: ', detailInfo.response.code);
        return data;
      };

      this.log.info('Create company request');
      return staffApi.createCompany()
        .then(showResponseCode)
        .then((companyData) => {
          companyId = companyData.id;
          this.log.info('Invite user');
          return staffApi.inviteUser(companyData);
        })
        .then(showResponseCode)
        .then(() => {
          this.log.info('Send user activity');
          return staffApi.sendUserActivity('company', companyId);
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

    listenWorkers() {

    }

    gerWorkersInfo() {

    }
  }

  module.exports = DryRunProcess;
})();

