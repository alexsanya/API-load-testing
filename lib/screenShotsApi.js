module.exports = (q, request, restify, responseHandler, log) => { 
  class ScreenshotsApi {

    constructor(apiUrl, companyId, token) {
      this.apiUrl = apiUrl;
      this.companyId = companyId;
      this.token = token;
      const clientConfig = {
        url: this.apiUrl,
        headers: {
          Authorization: `JWT ${this.token}`,
          'X-Company-ID': this.companyId,
        }
      };
      this.client = restify.createJsonClient(clientConfig);
    }

    getSignedUrl() {
      const deferred = q.defer();
      const date = new Date().toISOString();
      
      this.client.get(`/api/1.0/files/screenshot/signed-url/${date}/0`, responseHandler.bind(null, deferred));

      return deferred.promise.then((reqInfo) => {
        const url = JSON.parse(reqInfo.detailInfo.response.body).data;
        return { url, date };
      });
    }

    uploadScreenShot(signedUrl, payload) {
      const deferred = q.defer();

      request({
        method: 'PUT',
        uri: signedUrl,
        body: payload,
        headers: {
          'Content-Type': 'image/jpeg',
        },
      }, (err, res, body) => {
        log.info('Response status from S3: ', res.statusCode);
        log.info(res.headers);
        if (!err) {
          deferred.resolve();
        } else {
          log.error('Upload error: ', err);
          deferred.reject(err);
        }
      })

      return deferred.promise;
    }

    registerFileInSystem(date, meta) {
      const deferred = q.defer();

      const fullMeta = Object.assign(meta, { createdAt: date });
      this.client.put(`/api/1.0/files/screenshot/${date}/0`,
        fullMeta,
        responseHandler.bind(null, deferred)
      );

      return deferred.promise;
    }

  }

  return ScreenshotsApi;
}