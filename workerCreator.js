import getMessageQueue from './messageQueue';
import Q from './node_modules/q';
import throng from './node_modules/throng';
import logger from './node_modules/logfmt';

class WorkerCreator {

	constructor(id, messageQueue) {
		this.id = id;
		this.messageQueue = messageQueue;
	}

	createCompany(numOfUsers) {
		logger.log({
			worker: this.id,
        	type: 'info',
        	msg: 'company created'
    	});
		this.messageQueue.push('newCompany', {
			name: 'CompanyName'
		});

		return Q.resolve();
	}

	beginWork() {
		logger.log({
        	type: 'info',
        	msg: `worker ${this.id} started`,
    	});
		this.messageQueue.on('createCompany', this.createCompany.bind(this));
	}

	shutdown() {
		logger.log({ type: 'info', msg: 'shutting down' });
		process.exit();
	}
}

throng(start, { workers: 3 });

function start(id) {
	const worker = new WorkerCreator(id, getMessageQueue());

    worker.beginWork();
    process.on('SIGTERM', worker.shutdown);
}
