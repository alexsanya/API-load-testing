module.exports = (q, log, staffApi, contentProvider, streamBuffers) => {

  class ScreenshotGenerator {
    constructor(userData) {
      this.userData = userData;
      this.bufferDef = contentProvider.bufferizeScreenShots();
    }

    sendScreenShot() {
      log.info('sending screenshot to user', this.userData);
      this.bufferDef.then(() => {
        log.info('screenshots bufferized');
        const screenshot = contentProvider.getScreenShot();
        staffApi.getSignedUrl(this.userData.apiUrl, this.userData.companyId, this.userData.token).then((signedUrl) => {
          log.info('Signed url: ', signedUrl);
          return { signedUrl, screenshot };
        })
        .then(({ signedUrl, screenshot }) => {
          return staffApi.uploadScreenShot(signedUrl.url, screenshot.content).then(() => {
            const date = signedUrl.date;
            const metadata = screenshot.metadata;
            return { date, metadata };
          });
        })
        .then(({ date, metadata }) => {
          return staffApi.registerFileInSystem(this.userData.apiUrl, this.userData.companyId, this.userData.token, date, metadata);
        })
        .catch((err) => {
          log.error(err);
        });
      })
      .catch((err) => {
        log.error(err);
      })
    }
  }

  return ScreenshotGenerator;
}