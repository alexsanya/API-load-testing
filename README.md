# API-load-testing

##Prepare
* npm install

##Start
* master: babel-node master.js --presets es2015,stage-2
* workerCreator: babel-node workerCreator.js --presets es2015,stage-2
* workerActivity: babel-node workerActivity.js --presets es2015,stage-2

##Components
* master.js - master process
* workerCreator.js - Sign-up, Create company, Create workspace, Invite users
* workerActivity.js - Emulate user activity
