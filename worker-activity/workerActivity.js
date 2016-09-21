(() => {
  'use strict';

  module.exports = (q, io, DigestTimer, messageQueue, staffApi, ActiveUser, restify, contentProvider, activityConfig) => {

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

        const activityEmulation = new DigestTimer(
          ACTIVITY_EVENTS_INTERVAL_S,
          QUANTUM_TIME_MS,
          (clientIndex) => {
            this.logger.info(`activity request sent to client ${clientIndex}`);
            this.usersList[clientIndex].sendActivityRequest(activityConfig);
          }
        );

        messageQueue.on('newUser', (userData) => {
          this.createUser(userData).then((user) => {
            this.logger.debug('captured newUser message', user);
            this.usersList.push(user);
            activityEmulation.setNumber(this.usersList.length);
          });

          return q.resolve();
        });

        const doDigestLoop = () => {
          activityEmulation.tick();
          setTimeout(doDigestLoop, QUANTUM_TIME_MS);
        };

        doDigestLoop();
      }

      createUser(userData) {
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
            messageQueue.push('userLoggedIn', {
              apiUrl: userData.apiUrl,
              companyId: nameDepartment,
              token: apiConnection.getToken(),
            });
            const deferred = q.defer();
            const socketConnection = io(userData.socketHost, {
              path: userData.socketPath,
              query: {token: apiConnection.getToken()},
              transports: ['websocket']
            });
            socketConnection.on('connect', () => {
              deferred.resolve({apiConnection, socketConnection});
            });
            socketConnection.on('error', (error) => {
              this.logger.error('Socket connection error: ', error);
              console.log(error);
              deferred.reject(error);
            });
            return deferred.promise;
          })
          .then(({apiConnection, socketConnection}) => {
            this.logger.info('established socket connection');
            return apiConnection.authorization(nameDepartment).then((resp) => {
              const companyId = resp.id;
              return {apiConnection, socketConnection, companyId};
            });
          })
          .then(({apiConnection, socketConnection, companyId}) => {
            this.logger.info('company authorized');
            return new ActiveUser(
              apiConnection,
              socketConnection,
              companyId,
              nameDepartment,
              ['lazy', 'normal', 'effective'][contentProvider.getRandomInt(0, 2)]
            );
          })
      }
    }

    return WorkerActivity;

  };
})();
