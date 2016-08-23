(() => {
  'use strict';

  class WorkerActivity {
    constructor(q, WebSocket, DigestTimer, messageQueue,
      staffApi, logger, ActiveUser, sockConnectionURL, activityConfig) {
      this.q = q;
      this.WebSocket = WebSocket;
      this.DigestTimer = DigestTimer;
      this.messageQueue = messageQueue;
      this.staffApi = staffApi;
      this.logger = logger;
      this.ActiveUser = ActiveUser;
      this.sockConnectionURL = sockConnectionURL;
      this.activityConfig = activityConfig;
      this.usersList = [];
    }

    beginWork() {
      const QUANTUM_TIME_MS = 100;
      const SOCKET_PING_INTERVAL_S = 25;
      const ACTIVITY_EVENTS_INTERVAL_S = 3 * 60;

      const socketPinger = new this.DigestTimer(
        SOCKET_PING_INTERVAL_S,
        QUANTUM_TIME_MS,
        (clientIndex) => {
          this.logger.info(`ping request sent to client ${clientIndex}`);
          this.usersList[clientIndex].sentPingRequest();
        }
      );

      const activityEmulation = new this.DigestTimer(
        ACTIVITY_EVENTS_INTERVAL_S,
        QUANTUM_TIME_MS,
        (clientIndex) => {
          this.logger.info(`activity request sent to client ${clientIndex}`);
          this.usersList[clientIndex].sendActivityRequest(this.activityConfig)
            .catch(({ err, detailInfo }) => {
              this.logger.error('requesr error', err, detailInfo);
              this.messageQueue.push('workerRequestError', detailInfo);
            });
        }
      );

      this.messageQueue.on('newUser', (userData) => {
        const typeDepartment = userData.company ? 'company' : 'workspace';
        const nameDepartment = userData[typeDepartment];
        this.createUser(userData.authToken, nameDepartment, typeDepartment).then((user) => {
          this.logger.debug('captured newUser message', user);
          this.usersList.push(user);
          socketPinger.setNumber(this.usersList.length);
          activityEmulation.setNumber(this.usersList.length);
        });

        return this.q.resolve();
      });

      const doDigestLoop = () => {
        socketPinger.tick();
        activityEmulation.tick();
        setTimeout(doDigestLoop, QUANTUM_TIME_MS);
      };

      doDigestLoop();
    }

    createUser(authToken, nameDepartment, typeDepartment) {
      const Client = this.WebSocket.client;
      const socketClient = new Client();
      const deferred = this.q.defer();

      socketClient
        .connect(`${this.sockConnectionURL}?token=${authToken}&EIO=3&transport=websocket`);
      socketClient.on('connect', (connection) => {
        this.logger.debug('established socket connection ', connection);
        deferred.resolve(new this.ActiveUser(
          connection,
          this.staffApi,
          nameDepartment,
          typeDepartment
          )
        );
      });

      return deferred.promise;
    }
  }

  module.exports = WorkerActivity;
})();
