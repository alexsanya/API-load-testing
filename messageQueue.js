import kue from './node_modules/kue';

class MessageQueue {

  constructor() {
    this.queue = kue.createQueue();
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

export default function getMessageQueue() {
  return new MessageQueue();
}
