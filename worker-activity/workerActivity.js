(() => {
  'use strict';

  class WorkerActivity {
    constructor(q, WebSocket, DigestTimer, messageQueue,
      staffApi, logger, ActiveUser, sockConnectionURL, requestStats, restify, apiUrl, contentProvider, activityConfig) {
      this.q = q;
      this.WebSocket = WebSocket;
      this.DigestTimer = DigestTimer;
      this.messageQueue = messageQueue;
      this.staffApi = staffApi;
      this.logger = logger;
      this.ActiveUser = ActiveUser;
      this.sockConnectionURL = sockConnectionURL;
      this.activityConfig = activityConfig;
      this.requestStats = requestStats;
      this.restify = restify;
      this.apiUrl = apiUrl;
      this.contentProvider = contentProvider;
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
        this.createUser(userData).then((user) => {
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

    createUser(userData) {
      const Client = this.WebSocket.client;
      const socketClient = new Client();
      const deferred = this.q.defer();

      const typeDepartment = userData.company ? 'company' : 'workspace';
      const nameDepartment = userData[typeDepartment];

      return this.staffApi.register(this.q, this.restify, this.requestStats, this.apiUrl, userData)
        .then((userData) => {
          this.logger.info('User registered', userData);
          return this.contentProvider.getAuthData(userData);
        })
        .then((authData) => {
          this.logger.info('Authorization...', authData);
          return this.staffApi.signUp(this.q, this.requestStats, this.contentProvider, this.restify,  this.apiUrl, authData, {
            'X-Company-ID': nameDepartment,
          })
        })
        .then((staffApi) => {
          let deferred = this.q.defer();
          socketClient
            .connect(`${this.sockConnectionURL}?token=${staffApi.getToken()}&EIO=3&transport=websocket`);
          socketClient.on('connect', (connection) => {
            deferred.resolve({staffApi, connection});
          });
          return deferred.promise;
        })
        .then(({staffApi, connection}) => {
          this.logger.info('established socket connection ');
          
          return new this.ActiveUser(
            connection,
            staffApi,
            ['lazy', 'normal', 'effective'][this.contentProvider.getRandomInt(0, 2)]
          );
        
        });
    }
  }

  module.exports = WorkerActivity;
})();
