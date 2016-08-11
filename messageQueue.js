import kue from './node_modules/kue';

class MessageQueue {

	constructor(name) {
		this.queue = kue.createQueue();
	}

	on(jobName, handler) {
		this.queue.process(jobName, (job, ack) => { 
			handler(job.data).then(ack);
		});
	}

	push(jobName, data) {
		this.queue.create(jobName, data).save();
	}
}

export default function getMessageQueue() {
	return new MessageQueue();
};
