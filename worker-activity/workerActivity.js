(() => {
  'use strict';

  module.exports = (q, WebSocket, DigestTimer, messageQueue, staffApi, ActiveUser, restify, contentProvider, activityConfig) => {

    class WorkerActivity {
      constructor(requestStats, logger) {
        this.logger = logger;
        this.requestStats = requestStats;
        this.usersList = [];
      }

      beginWork() {
        const QUANTUM_TIME_MS = 100;
        const SOCKET_PING_INTERVAL_S = 25;
        const ACTIVITY_EVENTS_INTERVAL_S = 3 * 60;

        const socketPinger = new DigestTimer(
          SOCKET_PING_INTERVAL_S,
          QUANTUM_TIME_MS,
          (clientIndex) => {
            this.logger.info(`ping request sent to client ${clientIndex}`);
            this.usersList[clientIndex].sentPingRequest();
          }
        );

        const activityEmulation = new DigestTimer(
          ACTIVITY_EVENTS_INTERVAL_S,
          QUANTUM_TIME_MS,
          (clientIndex) => {
            this.logger.info(`activity request sent to client ${clientIndex}`);
            this.usersList[clientIndex].sendActivityRequest(activityConfig)
              .catch(({ err, detailInfo }) => {
                this.logger.error('requesr error', err, detailInfo);
                messageQueue.push('workerRequestError', detailInfo);
              });
          }
        );

        messageQueue.on('newUser', (userData) => {
          this.createUser(userData).then((user) => {
            this.logger.debug('captured newUser message', user);
            this.usersList.push(user);
            socketPinger.setNumber(this.usersList.length);
            activityEmulation.setNumber(this.usersList.length);
          });

          return q.resolve();
        });

        const doDigestLoop = () => {
          socketPinger.tick();
          activityEmulation.tick();
          setTimeout(doDigestLoop, QUANTUM_TIME_MS);
        };

        doDigestLoop();
      }

      createUser(userData) {
        const Client = WebSocket.client;
        const socketClient = new Client();
        const deferred = q.defer();

        const typeDepartment = userData.company ? 'company' : 'workspace';
        const nameDepartment = userData[typeDepartment];

        return staffApi.register(q, restify, this.requestStats, userData.apiUrl, userData)
          .then((userData) => {
            this.logger.info('User registered', userData);
            return contentProvider.getAuthData(userData);
          })
          .then((authData) => {
            this.logger.info('Authorization...', authData);
            return staffApi.signUp(q, this.requestStats, contentProvider, restify, userData.apiUrl, authData, {
              'X-Company-ID': nameDepartment,
            })
          })
          .then((apiConnection) => {
            this.logger.info('user authorized');
            let deferred = q.defer();
            socketClient
              .connect(`${userData.socketUrl}?token=${apiConnection.getToken()}&EIO=3&transport=websocket`);
            socketClient.on('connect', (socketConnection) => {
              deferred.resolve({apiConnection, socketConnection});
            });
            socketClient.on('connectFailed', (error) => {
              deferred.reject(error);
            });
            return deferred.promise;
          })
          .catch((error) => {
            this.logger.error('Socket connection error: ', error);
          })
          .then(({apiConnection, socketConnection}) => {
            this.logger.info('established socket connection ');
            return new ActiveUser(
              apiConnection,
              socketConnection,
              ['lazy', 'normal', 'effective'][contentProvider.getRandomInt(0, 2)]
            );
          
          });
      }
    }

    return WorkerActivity;

  };
})();
