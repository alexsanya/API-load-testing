import staffAPI from './staffAPI';
import contentProvider from './contentProvider';
import getMessageQueue from './messageQueue';
import throng from './node_modules/throng';
import logger from './node_modules/logfmt';

class WorkerCreator {

  constructor(id, messageQueue) {
    this.id = id;
    this.messageQueue = messageQueue;
  }

  createCompany(data) {
    logger.log({
      worker: this.id,
      type: 'info',
      msg: 'company created',
    });
    return staffAPI.createCompany(contentProvider.getNewCompanyData())
          .then((companyData) => {
            for (let i = 0; i < data.numOfUsers; i++) {
              staffAPI.inviteUser(companyData, contentProvider.getNewUserData()).then((userData) => {
                logger.log(userData);
                this.messageQueue.push('newUser', userData);
              });
            }
          });
  }

  beginWork() {
    logger.log({
          type: 'info',
          msg: `worker ${this.id} started`,
      });
    this.messageQueue.on('createCompany', this.createCompany.bind(this));
  }

  shutdown() {
    logger.log({ type: 'info', msg: 'shutting down' });
    process.exit();
  }
}

throng(start, { workers: 3 });

function start(id) {
  const worker = new WorkerCreator(id, getMessageQueue());

    worker.beginWork();
    process.on('SIGTERM', worker.shutdown);
}
