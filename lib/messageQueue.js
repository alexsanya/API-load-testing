(() => {
  'use strict';

  const JOB_LIFETIME = 5000;

  class MessageQueue {

    constructor(kue) {
      this.queue = kue.createQueue();
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

  module.exports = function getMessageQueue(kue) {
    return new MessageQueue(kue);
  };
})();
