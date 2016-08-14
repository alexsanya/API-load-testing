import getMessageQueue from './messageQueue';
import Q from './node_modules/q';

const messageQueue = getMessageQueue();

messageQueue.on('newUser', () => Q.resolve());
messageQueue.on('slowRequest', () => Q.resolve());
messageQueue.on('statsData', () => Q.resolve());
