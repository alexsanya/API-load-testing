module.exports = (q, log, staffApi) => {
  class ScreenshotGenerator {
    constructor(userData) {
      this.userData = userData;
    }

    sendScreenShot() {
      log.info('sending screenshot to user', this.userData);
      staffApi.getSignedUrl(this.userData.apiUrl, this.userData.companyId, this.userData.token).then((signedUrl) => {
        log.info('Signed url: ', signedUrl);
      });
    }
  }

  return ScreenshotGenerator;
}