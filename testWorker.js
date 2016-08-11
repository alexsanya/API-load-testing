import getMessageQueue from './messageQueue';

console.log('Test worker started..');

getMessageQueue().push('createCompany');