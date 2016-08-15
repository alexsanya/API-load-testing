import Q from './node_modules/q';
import logger from './node_modules/logfmt';
import throng from './node_modules/throng';
import Websocket from './node_modules/websocket';
import config from './config';
import { getStaffApiByToken } from './staffAPI';
import getMessageQueue from './messageQueue';
import contentProvider from './contentProvider';

class ActiveUser {
  constructor(staffApi, structureBelongsTo, authToken) {
    const WebSocketClient = Websocket.client;
    const client = new WebSocketClient();
    const connectionDeferred = Q.defer();
    this.staffApi = staffApi;
    this.structureBelongsTo = structureBelongsTo;
    this.connectionPromise = connectionDeferred.promise;
    client.connect(`${config.socketConnectionURL}?token=${authToken}&EIO=3&transport=websocket`);
    client.on('connect', (connection) => {
      connectionDeferred.resolve(connection);
    });
  }

  sentPingRequest() {
    this.connectionPromise.then((connection) => {
      connection.sendUTF('2');
    });
  }

  sendActivityRequest() {
    this.staffApi.sendUserActivity(contentProvider.getUserActivityData(this.structureBelongsTo));
  }
}

class WorkerActivity {
  constructor(workerId, messageQueue) {
    this.usersList = [];
    this.workerId = workerId;
    this.userIndex = 0;
    this.socketIndex = 0;
    this.messageQueue = messageQueue;
  }

  sendActivityRequest() {
    if (this.userIndex < this.usersList.length) {
      this.usersList[this.userIndex].sendActivityRequest();
    }
    this.userIndex = (this.userIndex + 1) % 600;
    setTimeout(this.sendActivityRequest.bind(this), 300);
  }

  socketPing() {
    if (this.socketIndex < this.usersList.length) {
      this.usersList[this.socketIndex].sentPingRequest();
    }
    this.socketIndex = (this.socketIndex + 1) % 600;
    setTimeout(this.socketPing.bind(this), 40);
  }

  beginWork() {
    logger.log({
      type: 'info',
      msg: `worker ${this.workerId} started`,
    });

    this.messageQueue.on('newUser', (userData) => {
      let structureBelongsTo;
      if (userData.company) {
        structureBelongsTo = { company: userData.company };
      } else {
        structureBelongsTo = { workspace: userData.workspace };
      }
      this.usersList.push(this.createUser(userData.authToken, structureBelongsTo));

      return Q.resolve();
    });
    this.socketPing();
    this.sendActivityRequest();
  }

  createUser(authToken, structureBelongsTo) {
    const requestStatsInfo = {
      slowRequestMs: config.slowRequestMs,
      avgInfoIntervalMs: config.avgInfoIntervalMs,
      onSlowRequest: (info) => {
        this.messageQueue.push('slowRequest', {
          info,
          workerId: this.workerId,
          workerType: 'activity',
        });
      },
      onAvgResponceInfo: (info) => {
        this.messageQueue.push('statsData', {
          info,
          workerId: this.workerId,
          workerType: 'activity',
        });
      },
    };
    const staffApi = getStaffApiByToken(authToken, requestStatsInfo);
    return new ActiveUser(staffApi, structureBelongsTo, authToken);
  }

  shutdown() {
    logger.log({ type: 'info', msg: 'shutting down' });
    process.exit();
  }
}

function start(workerId) {
  const worker = new WorkerActivity(workerId, getMessageQueue());
  worker.beginWork();
  process.on('SIGTERM', worker.shutdown);
}

throng({
  start,
  workers: config.workerActivityConcurrency,
});

