module.exports = (q, log, staffApi, ScreenShotsApi, contentProvider) => {

  class ScreenshotGenerator {
    constructor(userData) {
      this.userData = userData;
      this.bufferDef = contentProvider.bufferizeScreenShots();
      this.screenShotsApi = new ScreenShotsApi(userData.apiUrl, userData.companyId, userData.token);
    }

    sendScreenShot() {
      log.info('sending screenshot to user', this.userData);
      this.bufferDef.then(() => {
        log.info('screenshots bufferized');
        const screenshot = contentProvider.getScreenShot();
        this.screenShotsApi.getSignedUrl().then((signedUrl) => {
          log.info('Signed url: ', signedUrl);
          return { signedUrl, screenshot };
        })
        .then(({ signedUrl, screenshot }) => {
          return this.screenShotsApi.uploadScreenShot(signedUrl.url, screenshot.content).then(() => {
            const date = signedUrl.date;
            const metadata = screenshot.metadata;
            return { date, metadata };
          });
        })
        .then(({ date, metadata }) => {
          return this.screenShotsApi.registerFileInSystem(date, metadata);
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