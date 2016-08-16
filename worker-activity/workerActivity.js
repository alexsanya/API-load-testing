(() => {
  'use strict';

  class WorkerActivity {
    constructor(q, webSocket, digestTimer, messageQueue, staffApi, ActiveUser, sockConnectionURL) {
      this.q = q;
      this.webSocket = webSocket;
      this.digestTimer = digestTimer;
      this.messageQueue = messageQueue;
      this.staffApi = staffApi;
      this.ActiveUser = ActiveUser;
      this.sockConnectionURL = sockConnectionURL;
      this.usersList = [];
      this.userIndex = 0;
      this.socketIndex = 0;
    }

    beginWork() {
      const QUANTUM_TIME_MS = 100;
      const SOCKET_PING_INTERVAL_S = 25;
      const ACTIVITY_EVENTS_INTERVAL  = 3*60;

      const socketPinger = new this.digestTimer(
        SOCKET_PING_INTERVAL_S,
        QUANTUM_TIME_MS,
        (index) => {
          this.usersList[index].sentPingRequest();
        }
      );

      const activityEmulation = new this.digestTimer(
        ACTIVITY_EVENTS_INTERVAL,
        QUANTUM_TIME_MS,
        (index) => {
          this.usersList[index].sendActivityRequest();
        }
      );

      this.messageQueue.on('newUser', (userData) => {
        const typeDepartment = userData.company ? 'company' : 'workspace';
        const nameDepartment = userData[typeDepartment];
        this.createUser(userData.authToken, nameDepartment, typeDepartment).then((user) => {
          this.usersList.push(user);
          socketPinger.setNumber(this.usersList.length);
          activityEmulation.setNumber(this.usersList.length);
        });

        return this.q.resolve();
      });

      let doDigestLoop = () => {
        socketPinger.tick();
        activityEmulation.tick();
        setTimeout(doDigestLoop, QUANTUM_TIME_MS);
      }

      doDigestLoop();
    }

    createUser(authToken, nameDepartment, typeDepartment) {
      const socketClient = new this.webSocket.client();
      const deferred = this.q.defer();

      socketClient.connect(`${this.sockConnectionURL}?token=${authToken}&EIO=3&transport=websocket`);
      socketClient.on('connect', (connection) => {
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
