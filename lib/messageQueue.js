(() => {
  'use strict';

  const JOB_LIFETIME = 5000;

  module.exports = function (kue) {
    class MessageQueue {

      constructor() {
        this.queue = kue.createQueue({
          prefix: 'q',
          redis: {
            port: 6379,
            host: '127.0.0.1',
          },
        });
        this.queue.on('job enqueue', (jobId) => {
          setTimeout(() => {
            kue.Job.get(jobId, (err, job) => {
              if (job) {
                job.remove();
              }
            });
          }, JOB_LIFETIME);
        });
      }

      on(jobName, handler) {
        this.queue.process(jobName, (job, done) => {
          handler(job.data).then(done);
        });
      }

      push(jobName, data) {
        this.queue.create(jobName, data).save();
      }
    }

    return new MessageQueue();
  };
})();
