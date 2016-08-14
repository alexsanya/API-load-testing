import signUp from './staffAPI';
import contentProvider from './contentProvider';
import getMessageQueue from './messageQueue';
import config from './config';
import throng from './node_modules/throng';
import logger from './node_modules/logfmt';

class WorkerCreator {

  constructor(id, messageQueue) {
    this.id = id;
    this.messageQueue = messageQueue;
  }

  requestErrorHandler(err) {
    this.messageQueue.push('workerCreatorRequestError', err);
  }

  createCompany(staffApi, data) {
    logger.log({
      worker: this.id,
      type: 'info',
      msg: 'company created',
    });
    return staffApi.createCompany(contentProvider.getNewCompanyData())
          .then((companyData) => {
            for (let i = 0; i < data.numOfUsers; i++) {
              staffApi.inviteUser(companyData)
                .then((userData) => {
                  logger.log(userData);
                  this.messageQueue.push('newUser', userData);
                })
                .catch(this.requestErrorHandler.bind(this));
            }
          })
          .catch(this.requestErrorHandler.bind(this));
  }

  beginWork() {
    logger.log({
      type: 'info',
      msg: `worker ${this.id} started`,
    });
    signUp({
      slowRequestMs: config.slowRequestMs,
      avgInfoIntervalMs: config.avgInfoIntervalMs,
      onSlowRequest: (info) => {
        this.messageQueue.push('slowRequest', {
          info,
          workerType: 'creator',
          workerId: this.id,
        });
      },
      onAvgResponceInfo: (info) => {
        this.messageQueue.push('statsData', {
          info,
          workerType: 'creator',
          workerId: this.id,
        });
      },
    }).then((staffApi) => {
      this.staffApi = staffApi;
      this.messageQueue.on('createCompany', this.createCompany.bind(this, staffApi));
    }).catch(this.requestErrorHandler.bind(this));
  }

  shutdown() {
    logger.log({ type: 'info', msg: 'shutting down' });
    process.exit();
  }
}

function start(id) {
  const worker = new WorkerCreator(id, getMessageQueue());

  worker.beginWork();
  process.on('SIGTERM', worker.shutdown);
}

throng({
  start,
  workers: config.workerCreatorConcurrency,
});
