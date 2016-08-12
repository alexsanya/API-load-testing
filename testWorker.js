import logger from './node_modules/logfmt';
import getMessageQueue from './messageQueue';

logger.log('Test worker started..');

getMessageQueue().push('createCompany', {
  numOfUsers: 3,
});

