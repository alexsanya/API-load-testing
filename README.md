## Structure
- /master - master process
- /worker-creator - Sign-up, Create company, Create workspace, Invite users
- /worker-activity - Emulate user activity

## Launch
- npm install -g babel-cli babel-core babel-preset-es2015 babel-preset-stage-2
- ./worker-activity/start.sh
- ./worker-creator/start.sh
- ./master/start.sh

## Warning
Worker-activity should be launched before worker-creator, otherwise it will unable to capture authentication token and making requests to API